import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { ServiceRequestStatus } from "@prisma/client";
import { triggerStatusNotification } from "@/lib/notifications";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    try {
        const { message } = await req.json();
        const resolvedParams = await params;

        const updatedRequest = await prisma.serviceRequest.update({
            where: { id: resolvedParams.id },
            data: {
                status: ServiceRequestStatus.CLARIFICATION_REQUIRED,
                notes: message // Storing user-facing message in notes for now
            },
            include: { user: true, service: true }
        });

        // Notify user via Unified Notification Engine
        await triggerStatusNotification({
            userId: updatedRequest.userId,
            serviceRequestId: updatedRequest.id,
            serviceName: updatedRequest.service?.name || "Service",
            status: updatedRequest.status,
            userEmail: updatedRequest.user.email
        });

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error("Clarification Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
