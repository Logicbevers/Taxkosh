import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { razorpay, isRazorpayConfigured } from "@/lib/razorpay";

/**
 * Documents uploaded during the pre-payment purchase flow are created before the
 * service request exists, so they have serviceRequestId = null. Once the request
 * is created, claim the user's loose (unassigned) documents for it, otherwise the
 * admin can never see them and the document-requirement gate blocks processing.
 */
async function linkLooseDocuments(userId: string, serviceRequestId: string) {
    await prisma.document.updateMany({
        where: { userId, serviceRequestId: null, taxReturnId: null },
        data: { serviceRequestId },
    });
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { serviceId, planId } = body;

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

        // Demo mode: no real gateway keys configured. Skip Razorpay entirely and
        // create a pending request the client can settle via the demo endpoint,
        // so stakeholders can walk the full checkout without live credentials.
        if (!isRazorpayConfigured()) {
            const serviceReq = await prisma.serviceRequest.create({
                data: {
                    userId: session.user.id,
                    serviceId,
                    planId,
                    status: "PAYMENT_PENDING",
                    amount: amountPaise,
                    razorpayOrderId: `demo_order_${Date.now()}`,
                },
            });
            await linkLooseDocuments(session.user.id, serviceReq.id);
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
        const receiptId = `sr_${session.user.id.slice(-6)}_${Date.now()}`;

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
        const serviceReq = await prisma.serviceRequest.create({
            data: {
                userId: session.user.id,
                serviceId,
                planId,
                status: "PAYMENT_PENDING",
                amount: amountPaise,
                razorpayOrderId: orderId,
            },
        });

        await linkLooseDocuments(session.user.id, serviceReq.id);

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
