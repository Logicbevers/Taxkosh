import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { generatePdfInvoice } from "@/lib/invoice";
import { uploadToS3 } from "@/lib/s3";
import { sendMail } from "@/lib/mailer";
import { paymentReceiptEmail } from "@/lib/email-templates";
import { parseDocumentRules, isConsentEligible } from "@/lib/document-rules";

/**
 * Documents uploaded during the pre-payment purchase flow are created before the
 * service request exists, so they land with serviceRequestId = null. The client
 * remembers the ids it just uploaded and passes them at checkout, so we attach
 * exactly those — anything looser guesses wrong. An earlier version claimed every
 * unassigned document the user had, which swept in stale abandoned uploads from
 * unrelated services (a months-old "Form 16" landing on a GST registration) and
 * could shadow the real file where the admin UI keys documents by label.
 *
 * The where-clause doubles as the authorization check: userId pins ownership, and
 * the null guards stop a caller from stealing a document off another request.
 * Returns how many were actually attached.
 */
export async function linkDocumentsToRequest(
    userId: string,
    serviceRequestId: string,
    documentIds: string[],
): Promise<number> {
    if (documentIds.length === 0) return 0;
    const { count } = await prisma.document.updateMany({
        where: { id: { in: documentIds }, userId, serviceRequestId: null, taxReturnId: null },
        data: { serviceRequestId },
    });
    return count;
}

/**
 * Record consent acknowledgements the customer made in place of uploading optional
 * documents. The consent text is snapshotted from the node's own documentRules
 * (never from the client), and only labels that are genuinely consent-eligible
 * (optional + have consent content) are accepted. Idempotent per (request,label)
 * so a checkout retry doesn't duplicate rows.
 */
export async function recordAcknowledgements(args: {
    serviceRequestId: string;
    userId: string;
    catalogNodeId?: string | null;
    labels: string[];
    ipAddress?: string | null;
}): Promise<number> {
    const { serviceRequestId, userId, catalogNodeId, labels, ipAddress } = args;
    if (!catalogNodeId || labels.length === 0) return 0;

    const node = await prisma.catalogNode.findUnique({
        where: { id: catalogNodeId },
        select: { documentRules: true },
    });
    const rules = parseDocumentRules(node?.documentRules);

    let count = 0;
    for (const label of labels) {
        const rule = rules.find((r) => r.label === label);
        if (!isConsentEligible(rule)) continue; // reject non-optional / unknown labels
        await prisma.documentAcknowledgement.upsert({
            where: { serviceRequestId_documentLabel: { serviceRequestId, documentLabel: label } },
            update: {},
            create: {
                serviceRequestId,
                userId,
                documentLabel: label,
                consentTextSnapshot: rule!.consentText ?? "",
                ipAddress: ipAddress ?? undefined,
            },
        });
        count++;
    }
    return count;
}

/**
 * A retry — dismissed Razorpay modal, double-clicked button, re-fired autoCheckout —
 * must reuse the pending request rather than open a second one. linkLooseDocuments
 * only claims *unassigned* documents, so a fresh request would start empty while the
 * user's uploads stay stranded on the abandoned request, invisible to the admin. That
 * forces the customer to upload everything a second time from the status screen.
 */
export async function findOrCreatePendingRequest(args: {
    userId: string;
    serviceId?: string;
    planId?: string;
    catalogNodeId?: string;
    amountPaise: number;
    razorpayOrderId: string;
}) {
    const { userId, serviceId, planId, catalogNodeId, amountPaise, razorpayOrderId } = args;

    const existing = await prisma.serviceRequest.findFirst({
        // `?? null` is load-bearing: Prisma drops an `undefined` filter entirely,
        // which would match a pending request for a different service/node/plan.
        // Public purchases now key on catalogNodeId; legacy callers still key on
        // serviceId/planId. Dedup must distinguish them so a retry reuses the right row.
        where: {
            userId,
            serviceId: serviceId ?? null,
            planId: planId ?? null,
            catalogNodeId: catalogNodeId ?? null,
            status: "PAYMENT_PENDING",
        },
    });

    if (existing) {
        // /verify resolves the request by razorpayOrderId, so it has to track the
        // newest order — the previous order was abandoned.
        return prisma.serviceRequest.update({
            where: { id: existing.id },
            data: { amount: amountPaise, razorpayOrderId },
        });
    }

    return prisma.serviceRequest.create({
        data: {
            userId,
            serviceId,
            planId,
            catalogNodeId,
            status: "PAYMENT_PENDING",
            amount: amountPaise,
            razorpayOrderId,
        },
    });
}

/**
 * Transition a PAYMENT_PENDING service request to PAID and run all downstream
 * side effects: generate + store the GST invoice, notify the user, and email
 * the receipt. Shared by the Razorpay webhook (real payments) and the demo
 * checkout endpoint (simulated payments) so both stay identical.
 *
 * The status flip uses `updateMany` with a status filter, making it an atomic,
 * idempotent guard: concurrent or duplicate deliveries see count=0 and no-op.
 */
export async function finalizePaidServiceRequest(params: {
    serviceRequestId: string;
    amountPaise: number;
    paymentId: string;
}): Promise<{ alreadyProcessed: boolean; invoiceNumber?: string }> {
    const { serviceRequestId, amountPaise: amount, paymentId } = params;

    const reqData = await prisma.serviceRequest.findUnique({
        where: { id: serviceRequestId },
        include: { user: true, platformInvoice: true, service: true, plan: true, catalogNode: true },
    });

    if (!reqData) return { alreadyProcessed: true };
    // Early exit avoids generating a PDF for an already-processed request.
    if (reqData.status !== "PAYMENT_PENDING") return { alreadyProcessed: true };

    // Requests now come from either the legacy Service or the CatalogNode tree.
    // Prefer whichever is set so the invoice, notification and receipt name the
    // actual service instead of the generic fallback.
    const catalogItem = reqData.service ?? reqData.catalogNode;
    const serviceName = catalogItem?.name || "Managed Service";

    // Use ?? (nullish) so slaHours=0 is preserved.
    const slaHours = catalogItem?.slaHours ?? 24;
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    // timestamp + random hex prevents invoice-number collisions.
    const invNumber = `TK-INV-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    const subtotal = Math.round(amount / 1.18);
    const gstTotal = amount - subtotal;
    const cgst = Math.round(gstTotal / 2);
    const sgst = gstTotal - cgst;

    // PDF generation is best-effort: a rendering failure must never block the
    // payment from settling. The invoice record is still created either way.
    let invoicePdfBuffer: Buffer | null = null;
    try {
        invoicePdfBuffer = await generatePdfInvoice({
            invoiceNumber: invNumber,
            date: new Date(),
            userName: reqData.user.name || "Customer",
            userEmail: reqData.user.email,
            userPan: reqData.user.pan || undefined,
            serviceCategory: serviceName,
            subtotal,
            cgst,
            sgst,
            igst: 0,
            total: amount,
        });
    } catch (e) {
        console.error("Failed to generate invoice PDF:", e);
    }

    // S3 upload is best-effort too — the invoice record is saved even without it.
    let s3Key: string | null = null;
    if (invoicePdfBuffer) {
        try {
            s3Key = await uploadToS3(invoicePdfBuffer, `${invNumber}.pdf`, "application/pdf");
        } catch (e) {
            console.error("Failed to upload invoice to S3:", e);
        }
    }

    // Atomic $transaction eliminates the TOCTOU race between the status check and
    // the status write, and ensures invoice + notification commit together.
    let alreadyProcessed = false;
    await prisma.$transaction(async (tx) => {
        const updateResult = await tx.serviceRequest.updateMany({
            where: { id: serviceRequestId, status: "PAYMENT_PENDING" },
            data: {
                status: "PAID",
                razorpayPaymentId: paymentId,
                slaDeadline,
            },
        });

        if (updateResult.count === 0) {
            alreadyProcessed = true;
            return;
        }

        if (!reqData.platformInvoice) {
            await tx.platformInvoice.create({
                data: {
                    userId: reqData.user.id,
                    serviceRequestId: reqData.id,
                    invoiceNumber: invNumber,
                    subtotal,
                    cgst,
                    sgst,
                    igst: 0,
                    total: amount,
                    s3Key,
                },
            });
        }

        await tx.notification.create({
            data: {
                userId: reqData.user.id,
                title: "Payment successful",
                message: `We've received your payment for ${serviceName}. Please upload your documents to get started.`,
                type: "info",
            },
        });
    });

    if (alreadyProcessed) return { alreadyProcessed: true };

    // Email is best-effort and never throws (simulated in dev); a failure here is
    // non-critical since the payment is recorded and the invoice is retrievable.
    const receipt = paymentReceiptEmail({
        userName: reqData.user.name || "there",
        serviceName,
        planName: reqData.plan?.planName ?? null,
        amountRupees: Math.round(amount / 100),
        serviceRequestId: reqData.id,
        invoiceNumber: invNumber,
    });
    await sendMail({
        to: reqData.user.email,
        subject: receipt.subject,
        html: receipt.html,
        attachments: invoicePdfBuffer
            ? [{ filename: `${invNumber}.pdf`, content: invoicePdfBuffer }]
            : undefined,
    });

    return { alreadyProcessed: false, invoiceNumber: invNumber };
}
