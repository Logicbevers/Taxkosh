import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { triggerStatusNotification, triggerAdminAlert } from "@/lib/notifications";
import z from "zod";

// Statuses a regular (non-admin) user is allowed to self-set.
const USER_ALLOWED_STATUSES = ["DOCUMENTS_SUBMITTED"] as const;

// Full list that admins/staff may set.
const updateStatusSchema = z.object({
    status: z.enum([
        "DOCUMENTS_PENDING",
        "DOCUMENTS_SUBMITTED",
        "UNDER_PROCESS",
        "CLARIFICATION_REQUIRED",
        "COMPLETED",
        "FILED",
        "REJECTED",
    ]),
});

export async function POST(
    req: Request,
    { params }: any
) {
    try {
        const resolvedParams = await params;
        const id = resolvedParams.id;
        const guard = await requireAuth();
        if (!guard.ok) return guard.response;

        const json = await req.json();
        const body = updateStatusSchema.parse(json);

        const existing = await prisma.serviceRequest.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Must own the request.
        if (existing.userId !== guard.session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Non-admin users may only transition their own request to DOCUMENTS_SUBMITTED.
        // All other status changes (COMPLETED, REJECTED, FILED, etc.) are admin-only.
        const adminRoles = ["ADMIN", "TAX_EXECUTIVE", "SENIOR_REVIEWER"];
        const isAdmin = adminRoles.includes(guard.session.user.role);
        if (!isAdmin && !USER_ALLOWED_STATUSES.includes(body.status as never)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updatedRequest = await prisma.serviceRequest.update({
            where: {
                id,
            },
            data: {
                status: body.status,
            },
            // select (not full include) so the user's password hash never leaks.
            include: { user: { select: { id: true, name: true, email: true } }, service: true },
        });

        // When the customer submits their documents, confirm to them and alert
        // the ops/CA team that there's work to review. Best-effort (never blocks).
        if (body.status === "DOCUMENTS_SUBMITTED") {
            const serviceName = updatedRequest.service?.name ?? "your service";
            await triggerStatusNotification({
                userId: updatedRequest.userId,
                serviceRequestId: updatedRequest.id,
                serviceName,
                status: "DOCUMENTS_SUBMITTED",
                userEmail: updatedRequest.user.email,
            });
            await triggerAdminAlert({
                serviceRequestId: updatedRequest.id,
                title: "Documents submitted",
                message: `${updatedRequest.user.name || "A customer"} submitted documents for ${serviceName}. Ready for review.`,
            });
        }

        return NextResponse.json(updatedRequest);
    } catch (error: unknown) {
        console.error("Failed to update status:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
