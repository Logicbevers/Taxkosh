import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { finalizePaidServiceRequest } from "@/lib/payments";

/**
 * Client-callback payment verification.
 *
 * Razorpay's checkout `handler` fires in the browser the instant a payment
 * succeeds and hands back { order_id, payment_id, signature }. We verify that
 * signature server-side (HMAC-SHA256 of `order_id|payment_id` with the key
 * secret) and finalize the request immediately — so payment no longer depends
 * on the webhook being reachable. The webhook remains as an idempotent backup
 * (finalizePaidServiceRequest is a no-op once the request is already PAID).
 */
export async function POST(req: Request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
        }

        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) {
            return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
        }

        // Verify the signature: HMAC-SHA256(order_id + "|" + payment_id, key_secret).
        const expected = crypto
            .createHmac("sha256", keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        const expectedBuf = Buffer.from(expected);
        const receivedBuf = Buffer.from(String(razorpay_signature));
        const valid =
            expectedBuf.length === receivedBuf.length &&
            crypto.timingSafeEqual(expectedBuf, receivedBuf);

        if (!valid) {
            return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
        }

        // Resolve the pending request from the order id, and confirm ownership
        // (never let one user finalize another user's order).
        const serviceReq = await prisma.serviceRequest.findUnique({
            where: { razorpayOrderId: razorpay_order_id },
            select: { id: true, userId: true, amount: true },
        });
        if (!serviceReq || serviceReq.userId !== guard.session.user.id) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        await finalizePaidServiceRequest({
            serviceRequestId: serviceReq.id,
            amountPaise: serviceReq.amount,
            paymentId: razorpay_payment_id,
        });

        return NextResponse.json({ success: true, serviceRequestId: serviceReq.id });
    } catch (e) {
        console.error("Payment verify error:", e);
        return NextResponse.json({ error: "Could not verify payment" }, { status: 500 });
    }
}
