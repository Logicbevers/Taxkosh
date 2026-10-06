/**
 * Regression check for the optional-document consent feature.
 *
 * Guards the server-side invariants that matter most:
 *   1. Only a consent-eligible (optional + has consent) document can be acknowledged.
 *      A non-optional doc or an unknown label is rejected.
 *   2. The acknowledged consent text is snapshotted from the NODE, not the client.
 *   3. The admin processing gate treats an acknowledgement as satisfying the
 *      requirement, but still blocks on a genuinely missing required document.
 *
 * Run: node tests/consent-acknowledgement.mjs   (needs DATABASE_URL)
 *
 * The acknowledge + gate logic is mirrored here (not imported) so this runs as plain
 * node with no bundler — it must stay in step with lib/payments.recordAcknowledgements
 * and the status-PATCH gate in app/api/admin/service-requests/[id]/route.ts.
 */
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseRules(value) {
    if (!Array.isArray(value)) return [];
    return value
        .filter((r) => r && typeof r === "object" && typeof r.label === "string")
        .map((r) => ({ label: r.label, optional: r.optional === true, consentText: r.consentText }));
}
const consentEligible = (rule) => !!rule?.optional && !!rule.consentText;

async function recordAcknowledgements(serviceRequestId, userId, catalogNodeId, labels) {
    if (!catalogNodeId || labels.length === 0) return 0;
    const node = await prisma.catalogNode.findUnique({ where: { id: catalogNodeId }, select: { documentRules: true } });
    const rules = parseRules(node?.documentRules);
    let count = 0;
    for (const label of labels) {
        const rule = rules.find((r) => r.label === label);
        if (!consentEligible(rule)) continue;
        await prisma.documentAcknowledgement.upsert({
            where: { serviceRequestId_documentLabel: { serviceRequestId, documentLabel: label } },
            update: {},
            create: { serviceRequestId, userId, documentLabel: label, consentTextSnapshot: rule.consentText ?? "" },
        });
        count++;
    }
    return count;
}

const stamp = Date.now();
let userId, catId, subId, leafId;

try {
    const user = await prisma.user.create({ data: { email: `consent-check-${stamp}@example.test`, name: "Consent Check" } });
    userId = user.id;

    const cat = await prisma.catalogNode.create({ data: { name: "CC Cat", slug: `cc-cat-${stamp}`, depth: 0, isLeaf: false, status: "active" } });
    catId = cat.id;
    const sub = await prisma.catalogNode.create({ data: { name: "CC Sub", slug: `cc-sub-${stamp}`, parentId: cat.id, depth: 1, isLeaf: false, status: "active" } });
    subId = sub.id;
    const CONSENT = "Server-side consent text for the interest certificate.";
    const leaf = await prisma.catalogNode.create({
        data: {
            name: "CC Service", slug: `cc-svc-${stamp}`, parentId: sub.id, depth: 2, isLeaf: true, status: "active",
            price: 1000, slaHours: 24,
            requiredDocuments: ["PAN Card", "Interest Certificate"],
            documentRules: [
                { label: "PAN Card", optional: false },
                { label: "Interest Certificate", optional: true, consentText: CONSENT },
            ],
        },
    });
    leafId = leaf.id;

    const sr = await prisma.serviceRequest.create({
        data: { userId, catalogNodeId: leaf.id, status: "PAYMENT_PENDING", amount: 100000, razorpayOrderId: `cc_${stamp}` },
    });

    // 1 + 2) Try to acknowledge the optional doc, a non-optional doc, and an unknown one.
    const n = await recordAcknowledgements(sr.id, userId, leaf.id, ["Interest Certificate", "PAN Card", "Ghost Doc"]);
    assert.equal(n, 1, "only the consent-eligible doc should be recorded");
    const acks = await prisma.documentAcknowledgement.findMany({ where: { serviceRequestId: sr.id } });
    assert.equal(acks.length, 1, `expected 1 acknowledgement, got ${acks.length}`);
    assert.equal(acks[0].documentLabel, "Interest Certificate", "wrong label acknowledged");
    assert.equal(acks[0].consentTextSnapshot, CONSENT, "snapshot must be the node's server-side text");

    // Idempotent: a checkout retry must not duplicate.
    await recordAcknowledgements(sr.id, userId, leaf.id, ["Interest Certificate"]);
    assert.equal(await prisma.documentAcknowledgement.count({ where: { serviceRequestId: sr.id } }), 1, "acknowledgement duplicated on retry");

    // 3) Gate: PAN not uploaded yet → still missing PAN; Interest is covered by consent.
    const gate = async () => {
        const r = await prisma.serviceRequest.findUnique({ where: { id: sr.id }, include: { catalogNode: true, documents: true, acknowledgements: true } });
        const required = r.catalogNode.requiredDocuments;
        const uploaded = r.documents.map((d) => d.label);
        const acked = r.acknowledgements.map((a) => a.documentLabel);
        return required.filter((x) => !uploaded.includes(x) && !acked.includes(x));
    };
    assert.deepEqual(await gate(), ["PAN Card"], "gate should still require PAN, not the acknowledged Interest Certificate");

    await prisma.document.create({ data: { userId, serviceRequestId: sr.id, label: "PAN Card", fileName: "pan.pdf", fileSize: 1, s3Key: `cc-${stamp}`, documentType: "OTHER" } });
    assert.deepEqual(await gate(), [], "gate should pass once PAN is uploaded and Interest is acknowledged");

    console.log("PASS — consent recorded for optional doc only (server-side snapshot); gate honours acknowledgements but still blocks a missing required doc");
} finally {
    if (userId) {
        const srs = await prisma.serviceRequest.findMany({ where: { userId }, select: { id: true } });
        const srIds = srs.map((s) => s.id);
        await prisma.documentAcknowledgement.deleteMany({ where: { serviceRequestId: { in: srIds } } });
        await prisma.document.deleteMany({ where: { userId } });
        await prisma.serviceRequest.deleteMany({ where: { userId } });
        await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    for (const id of [leafId, subId, catId]) if (id) await prisma.catalogNode.delete({ where: { id } }).catch(() => {});
    await prisma.$disconnect();
}
