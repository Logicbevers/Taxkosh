import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { triggerStatusNotification, triggerAdminAlert } from "@/lib/notifications";
import { z } from "zod";

const respondSchema = z.object({
    message: z.string().min(1, "Message cannot be empty").max(2000),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    const { id } = await params;

    try {
        const body = await req.json();
        const parsed = respondSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const request = await prisma.serviceRequest.findUnique({
            where: { id },
            include: { user: true, service: true },
        });
        if (!request || request.userId !== guard.session.user.id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const resubmitted = request.status === "CLARIFICATION_REQUIRED";

        await prisma.$transaction([
            prisma.internalNote.create({
                data: {
                    serviceRequestId: id,
                    authorId: guard.session.user.id,
                    content: `[Customer Response] ${parsed.data.message}`,
                },
            }),
            ...(resubmitted
                ? [prisma.serviceRequest.update({
                    where: { id },
                    data: { status: "DOCUMENTS_SUBMITTED" },
                })]
                : []),
        ]);

        // On resubmission after a clarification, confirm to the customer and
        // alert the ops/CA team. Best-effort — never blocks the response.
        if (resubmitted) {
            const serviceName = request.service?.name ?? "your service";
            await triggerStatusNotification({
                userId: request.userId,
                serviceRequestId: id,
                serviceName,
                status: "DOCUMENTS_SUBMITTED",
                userEmail: request.user.email,
            });
            await triggerAdminAlert({
                serviceRequestId: id,
                title: "Customer responded to clarification",
                message: `${request.user.name || "A customer"} replied on ${serviceName} and resubmitted for review.`,
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Respond Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
