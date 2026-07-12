import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDemoCheckoutAllowed } from "@/lib/razorpay";
import { finalizePaidServiceRequest } from "@/lib/payments";

/**
 * Demo-only payment settlement. Marks a pending service request PAID and runs
 * the same finalization as the real Razorpay webhook (invoice, notification,
 * receipt email). Guarded so it can never settle a payment in production:
 *  - refused outright when real Razorpay keys are configured
 *  - only the request's owner can settle it
 *  - only PAYMENT_PENDING requests are eligible
 */
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Hard stop: refused when real Razorpay keys exist, or when demo checkout
    // has been explicitly disabled (ALLOW_DEMO_CHECKOUT=false) on a live site.
    if (!isDemoCheckoutAllowed()) {
        return NextResponse.json({ error: "Demo payment is disabled" }, { status: 403 });
    }

    try {
        const { serviceRequestId } = await req.json();
        if (!serviceRequestId || typeof serviceRequestId !== "string") {
            return NextResponse.json({ error: "serviceRequestId is required" }, { status: 400 });
        }

        const sr = await prisma.serviceRequest.findUnique({
            where: { id: serviceRequestId },
            select: { id: true, userId: true, status: true, amount: true },
        });

        if (!sr || sr.userId !== session.user.id) {
            return NextResponse.json({ error: "Service request not found" }, { status: 404 });
        }
        if (sr.status !== "PAYMENT_PENDING") {
            // Idempotent: already settled is a success from the client's view.
            return NextResponse.json({ success: true, alreadyProcessed: true, serviceRequestId: sr.id });
        }

        const { alreadyProcessed } = await finalizePaidServiceRequest({
            serviceRequestId: sr.id,
            amountPaise: sr.amount ?? 0,
            paymentId: `demo_pay_${Date.now()}`,
        });

        return NextResponse.json({ success: true, alreadyProcessed, serviceRequestId: sr.id });
    } catch (e) {
        console.error("Demo payment completion error:", e);
        return NextResponse.json({ error: "Failed to complete demo payment" }, { status: 500 });
    }
}
