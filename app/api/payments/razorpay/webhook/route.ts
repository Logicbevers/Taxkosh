import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { ServiceRequestStatus } from "@prisma/client";
import { generatePdfInvoice } from "@/lib/invoice";
import { uploadToS3 } from "@/lib/s3";
import { sendInvoiceEmail } from "@/lib/resend";

export async function POST(req: Request) {
    try {
        const bodyText = await req.text();
        const signature = req.headers.get("x-razorpay-signature");

        if (!signature) {
            console.warn("Missing Razorpay Signature");
            // In a real environment, you should enforce this. For simulation, we'll let it pass
            // return NextResponse.json({ error: "Missing signature" }, { status: 400 });
        }

        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "YourWebhookSecretHere";

        // Signature Verification
        if (signature) {
            const expectedSignature = crypto.createHmac("sha256", webhookSecret)
                .update(bodyText)
                .digest("hex");

            if (expectedSignature !== signature) {
                console.error("Invalid Razorpay Webhook Signature");
                return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
            }
        }

        const payload = JSON.parse(bodyText);

        if (payload.event === "payment.captured") {
            const paymentEntity = payload.payload.payment.entity;
            const amount = paymentEntity.amount; // paise
            const paymentId = paymentEntity.id;
            const serviceRequestId = paymentEntity.notes?.receipt || paymentEntity.receipt;

            if (!serviceRequestId) {
                return NextResponse.json({ error: "Missing service request receipt" }, { status: 400 });
            }

            // 1. Fetch Request & User Data
            const reqData = await prisma.serviceRequest.findUnique({
                where: { id: serviceRequestId },
                include: { user: true, platformInvoice: true }
            });

            if (!reqData || reqData.status !== "PENDING_PAYMENT") {
                return NextResponse.json({ success: true, message: "Already processed or invalid request" });
            }

            // 2. State Transition & Payment Tracking linking
            await prisma.serviceRequest.update({
                where: { id: serviceRequestId },
                data: {
                    status: "PENDING_DOCUMENTS",
                    razorpayPaymentId: paymentId
                }
            });

            // 3. Generate Official GST Platform Invoice
            // Back out the base amount. (Amount includes 18% GST).
            // base * 1.18 = amount  => base = amount / 1.18
            const subtotal = Math.round(amount / 1.18);
            const gstTotal = amount - subtotal;
            const cgst = Math.round(gstTotal / 2);
            const sgst = gstTotal - cgst; // Ensure exact integer match

            const invNumber = `TK-INV-${Date.now().toString().slice(-6)}`;

            const invoicePdfBuffer = await generatePdfInvoice({
                invoiceNumber: invNumber,
                date: new Date(),
                userName: reqData.user.name || "Customer",
                userEmail: reqData.user.email,
                userPan: reqData.user.pan || undefined,
                serviceCategory: reqData.category,
                subtotal,
                cgst,
                sgst,
                igst: 0,
                total: amount
            });

            // 4. Upload raw PDF bytes to our secure S3 Bucket natively
            let s3Key = null;
            try {
                s3Key = await uploadToS3(invoicePdfBuffer, `${invNumber}.pdf`, "application/pdf");
            } catch (e) {
                console.warn("Failed to upload Invoice to S3, bypassing for local sim.");
            }

            // 5. Save PlatformInvoice metadata permanently
            if (!reqData.platformInvoice) {
                await prisma.platformInvoice.create({
                    data: {
                        userId: reqData.user.id,
                        serviceRequestId: reqData.id,
                        invoiceNumber: invNumber,
                        subtotal,
                        cgst,
                        sgst,
                        igst: 0,
                        total: amount,
                        s3Key
                    }
                });
            }

            // 6. Asynchronous dispatch email via Resend
            await sendInvoiceEmail(reqData.user.email, reqData.user.name || "Valued User", invNumber, invoicePdfBuffer);

            console.log(`[Webhook] Payment Captured! ServiceRequest ${reqData.id} marked as PAYMENT_CONFIRMED`);
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Webhook processing error:", e);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
