import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { razorpay, isRazorpayConfigured, isDemoCheckoutAllowed } from "@/lib/razorpay";
import { findOrCreatePendingRequest, linkDocumentsToRequest } from "@/lib/payments";

export async function POST(req: Request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    try {
        const body = await req.json();
        const { serviceId, planId } = body;

        // The ids the client uploaded during this checkout. Untrusted — ownership is
        // enforced in linkDocumentsToRequest, this only shapes the input.
        const documentIds: string[] = Array.isArray(body.documentIds)
            ? body.documentIds.filter((d: unknown): d is string => typeof d === "string")
            : [];

        // Always derive the charge from the server-side price — never trust the client's amount.
        let amountPaise: number;
        if (planId) {
            const plan = await prisma.servicePlan.findUnique({ where: { id: planId } });
            if (!plan) {
                return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
            }
            amountPaise = Math.round(plan.price * 100);
        } else if (serviceId) {
            const service = await prisma.service.findUnique({ where: { id: serviceId } });
            if (!service) {
                return NextResponse.json({ error: "Invalid service ID" }, { status: 400 });
            }
            amountPaise = Math.round(service.price * 100);
        } else {
            return NextResponse.json({ error: "A plan or service ID is required" }, { status: 400 });
        }

        // No real gateway keys configured:
        //  - demo checkout allowed  → simulate the payment (stakeholder demos)
        //  - demo checkout disabled → refuse cleanly instead of giving services
        //    away for free on a public deployment (ALLOW_DEMO_CHECKOUT=false)
        if (!isRazorpayConfigured() && !isDemoCheckoutAllowed()) {
            return NextResponse.json(
                { error: "Online payments are launching soon. Please contact support@taxkosh.com to proceed with this service." },
                { status: 503 }
            );
        }
        if (!isRazorpayConfigured()) {
            const serviceReq = await findOrCreatePendingRequest({
                userId: guard.session.user.id,
                serviceId,
                planId,
                amountPaise,
                razorpayOrderId: `demo_order_${Date.now()}`,
            });
            await linkDocumentsToRequest(guard.session.user.id, serviceReq.id, documentIds);
            return NextResponse.json({
                success: true,
                demoMode: true,
                serviceRequestId: serviceReq.id,
                amountPaise,
                currency: "INR",
            });
        }

        // We use a stable receipt id so we can reconcile even if the DB write
        // happens after the Razorpay order is created.
        const receiptId = `sr_${guard.session.user.id.slice(-6)}_${Date.now()}`;

        // 1. Create the Razorpay order FIRST. If the gateway is unavailable
        //    (missing/invalid keys, network), we bail out here and never create
        //    an orphan PAYMENT_PENDING service request in our DB.
        const options = {
            amount: amountPaise,
            currency: "INR",
            receipt: receiptId,
            payment_capture: 1, // auto-capture
        };
        let orderId: string;
        try {
            const order = await razorpay.orders.create(options);
            orderId = order.id;
        } catch (gatewayErr) {
            console.error("Razorpay order creation failed:", gatewayErr);
            return NextResponse.json(
                { error: "Payment gateway is temporarily unavailable. Please try again in a moment." },
                { status: 503 }
            );
        }

        // 2. Only now persist the pending service request, with the order id set.
        const serviceReq = await findOrCreatePendingRequest({
            userId: guard.session.user.id,
            serviceId,
            planId,
            amountPaise,
            razorpayOrderId: orderId,
        });

        await linkDocumentsToRequest(guard.session.user.id, serviceReq.id, documentIds);

        return NextResponse.json({
            success: true,
            serviceRequestId: serviceReq.id,
            razorpayOrderId: orderId,
            amountPaise,
            currency: "INR",
        });

    } catch (e) {
        console.error("Create Order Error:", e);
        return NextResponse.json({ error: "Something went wrong while starting your payment. Please try again." }, { status: 500 });
    }
}
