import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { finalizePaidServiceRequest } from "@/lib/payments";

export async function POST(req: Request) {
    try {
        const bodyText = await req.text();
        const signature = req.headers.get("x-razorpay-signature");

        if (!signature) {
            return NextResponse.json({ error: "Missing signature" }, { status: 400 });
        }

        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            throw new Error("RAZORPAY_WEBHOOK_SECRET env var must be set");
        }

        // Constant-time comparison prevents timing-based signature forgery.
        const expectedBuf = Buffer.from(
            crypto.createHmac("sha256", webhookSecret).update(bodyText).digest("hex")
        );
        const receivedBuf = Buffer.from(signature);
        const sigValid =
            expectedBuf.length === receivedBuf.length &&
            crypto.timingSafeEqual(expectedBuf, receivedBuf);

        if (!sigValid) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        const payload = JSON.parse(bodyText);

        if (payload.event === "payment.captured") {
            const paymentEntity = payload.payload.payment.entity;
            const amount = paymentEntity.amount; // paise
            const paymentId = paymentEntity.id;
            const orderId = paymentEntity.order_id;

            if (!orderId) {
                return NextResponse.json({ error: "Missing Razorpay order id" }, { status: 400 });
            }

            // Resolve the pending request from the Razorpay order id so we can
            // report an unknown order distinctly (Razorpay treats a 2xx as ack'd).
            const reqData = await prisma.serviceRequest.findUnique({
                where: { razorpayOrderId: orderId },
                select: { id: true },
            });

            if (!reqData) {
                return NextResponse.json({ success: true, message: "Unknown order" });
            }

            const { alreadyProcessed } = await finalizePaidServiceRequest({
                serviceRequestId: reqData.id,
                amountPaise: amount,
                paymentId,
            });

            if (alreadyProcessed) {
                return NextResponse.json({ success: true, message: "Already processed" });
            }
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Webhook processing error:", e);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
