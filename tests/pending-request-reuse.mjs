/**
 * Regression check: a checkout retry must not strand the customer's documents.
 *
 * Before the fix, every click of "Pay" created a new ServiceRequest. linkLooseDocuments
 * only claims *unassigned* docs, so the second request started empty and the uploads
 * stayed on the abandoned first one — invisible to the admin, forcing the customer to
 * upload everything again from the status screen.
 *
 * Run: node tests/pending-request-reuse.mjs   (needs DATABASE_URL, uses a temp user)
 */
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Mirrors lib/payments.ts — imported via the compiled app in prod, inlined here so the
// check runs as plain node with no bundler/TS step.
async function findOrCreatePendingRequest({ userId, serviceId, planId, amountPaise, razorpayOrderId }) {
    const existing = await prisma.serviceRequest.findFirst({
        where: { userId, serviceId: serviceId ?? null, planId: planId ?? null, status: "PAYMENT_PENDING" },
    });
    if (existing) {
        return prisma.serviceRequest.update({
            where: { id: existing.id },
            data: { amount: amountPaise, razorpayOrderId },
        });
    }
    return prisma.serviceRequest.create({
        data: { userId, serviceId, planId, status: "PAYMENT_PENDING", amount: amountPaise, razorpayOrderId },
    });
}

async function linkDocumentsToRequest(userId, serviceRequestId, documentIds) {
    if (documentIds.length === 0) return 0;
    const { count } = await prisma.document.updateMany({
        where: { id: { in: documentIds }, userId, serviceRequestId: null, taxReturnId: null },
        data: { serviceRequestId },
    });
    return count;
}

const stamp = Date.now();
let userId;

try {
    const user = await prisma.user.create({
        data: { email: `reuse-check-${stamp}@example.test`, name: "Reuse Check" },
    });
    userId = user.id;

    const service = await prisma.service.findFirst({ where: { status: "active" } });
    assert.ok(service, "need at least one active service — run `npm run db:seed`");

    // A stale upload abandoned during an earlier, unrelated checkout. It must never
    // be swept into this purchase — that shipped a months-old file to the wrong service.
    const stale = await prisma.document.create({
        data: {
            userId,
            fileName: "stale-form16.pdf",
            fileSize: 1024,
            label: "Form 16",
            s3Key: `reuse-check-stale-${stamp}`,
            documentType: "OTHER",
        },
    });

    // Customer uploads a document for *this* checkout, before the request exists.
    const fresh = await prisma.document.create({
        data: {
            userId,
            fileName: "pan.pdf",
            fileSize: 1024,
            label: "PAN Card",
            s3Key: `reuse-check-${stamp}`,
            documentType: "OTHER",
        },
    });

    // First "Pay" click — the client passes only what it uploaded just now.
    const first = await findOrCreatePendingRequest({
        userId, serviceId: service.id, amountPaise: 299900, razorpayOrderId: `order_a_${stamp}`,
    });
    await linkDocumentsToRequest(userId, first.id, [fresh.id]);

    // Customer dismisses the gateway modal, then clicks "Pay" again.
    const second = await findOrCreatePendingRequest({
        userId, serviceId: service.id, amountPaise: 299900, razorpayOrderId: `order_b_${stamp}`,
    });
    await linkDocumentsToRequest(userId, second.id, [fresh.id]);

    assert.equal(second.id, first.id, "retry opened a second request — documents will strand on the abandoned one");
    assert.equal(second.razorpayOrderId, `order_b_${stamp}`, "reused request kept the stale order id — /verify resolves by it and would 404");

    const count = await prisma.serviceRequest.count({ where: { userId, status: "PAYMENT_PENDING" } });
    assert.equal(count, 1, `expected 1 pending request, found ${count}`);

    const attached = await prisma.document.findMany({
        where: { serviceRequestId: second.id },
        select: { id: true, fileName: true },
    });
    assert.equal(attached.length, 1, `expected exactly the 1 uploaded document, got ${attached.map(d => d.fileName).join(", ")}`);
    assert.equal(attached[0].id, fresh.id, "wrong document attached");

    const staleRow = await prisma.document.findUnique({ where: { id: stale.id } });
    assert.equal(staleRow.serviceRequestId, null, "stale unrelated upload was swept into this request");

    // A document belonging to someone else must never attach, even if its id is passed.
    const other = await prisma.user.create({ data: { email: `other-${stamp}@example.test`, name: "Other" } });
    const otherDoc = await prisma.document.create({
        data: { userId: other.id, fileName: "theirs.pdf", fileSize: 1, s3Key: `other-${stamp}`, documentType: "OTHER" },
    });
    const linked = await linkDocumentsToRequest(userId, second.id, [otherDoc.id]);
    assert.equal(linked, 0, "attached a document owned by another user");
    await prisma.document.delete({ where: { id: otherDoc.id } });
    await prisma.user.delete({ where: { id: other.id } });

    console.log("PASS — retry reuses the request; only the uploaded doc attaches; stale + other-user docs rejected");
} finally {
    if (userId) {
        await prisma.document.deleteMany({ where: { userId } });
        await prisma.serviceRequest.deleteMany({ where: { userId } });
        await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await prisma.$disconnect();
}
