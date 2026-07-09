import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { ServiceRequestStatus } from "@prisma/client";
import { triggerStatusNotification } from "@/lib/notifications";
import { maskPAN } from "@/lib/security";
import { computeSla } from "@/lib/sla";

/**
 * Handle individual service request management (status updates, etc.)
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    try {
        const { id } = await params;
        const body = await req.json();
        const { status } = body;

        const VALID_STATUSES = new Set<string>(Object.values(ServiceRequestStatus));
        if (!status || !VALID_STATUSES.has(status)) {
            return NextResponse.json({ error: "Invalid or missing status value" }, { status: 400 });
        }
        
        // Prevent bypassing mandatory document requirements
        if (status === ServiceRequestStatus.UNDER_PROCESS || status === ServiceRequestStatus.READY_FOR_FILING || status === ServiceRequestStatus.FILED) {
            const checkReq = await prisma.serviceRequest.findUnique({
                where: { id },
                include: { service: true, documents: true }
            });
            const reqDocs = checkReq?.service?.requiredDocuments || [];
            const uploadedDocs = checkReq?.documents?.map(d => d.label) || [];
            const missing = reqDocs.filter(r => !uploadedDocs.includes(r as string));
            
            if (missing.length > 0) {
                return NextResponse.json({ error: "Cannot proceed. Awaiting mandatory artifacts: " + missing.join(", ") }, { status: 400 });
            }
        }

        const updatedRequest = await prisma.serviceRequest.update({
            where: { id },
            data: { status: status as ServiceRequestStatus },
            // select (not full include) so the user's password hash never leaks in the response.
            include: { user: { select: { id: true, name: true, email: true } }, service: true }
        });

        // Notification is best-effort: the status transition has already committed,
        // so a notification/email failure must not surface as a failed update.
        try {
            await triggerStatusNotification({
                userId: updatedRequest.userId,
                serviceRequestId: updatedRequest.id,
                serviceName: updatedRequest.service?.name || "Service",
                status: updatedRequest.status,
                userEmail: updatedRequest.user.email
            });
        } catch (notifyErr) {
            console.error("Status notification failed (non-fatal):", notifyErr);
        }

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error("Update Service Request Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    try {
        const { id } = await params;
        const request = await prisma.serviceRequest.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        pan: true,
                        phone: true,
                    }
                },
                service: true,
                plan: true,
                internalNotes: { 
                    include: { author: true },
                    orderBy: { createdAt: "desc" } 
                },
                documents: true
            }
        });

        if (!request) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        if (request.user?.pan) {
            (request.user as typeof request.user & { pan: string }).pan = maskPAN(request.user.pan);
        }

        const { hoursElapsed, slaStatus, slaLimitHours } = computeSla(request);
        return NextResponse.json({ ...request, hoursElapsed, slaStatus, slaLimitHours });
    } catch (error) {
        console.error("Fetch Service Request Detail Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
