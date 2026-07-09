import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
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

        const request = await prisma.serviceRequest.findUnique({ where: { id } });
        if (!request || request.userId !== guard.session.user.id) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        await prisma.$transaction([
            prisma.internalNote.create({
                data: {
                    serviceRequestId: id,
                    authorId: guard.session.user.id,
                    content: `[Customer Response] ${parsed.data.message}`,
                },
            }),
            ...(request.status === "CLARIFICATION_REQUIRED"
                ? [prisma.serviceRequest.update({
                    where: { id },
                    data: { status: "DOCUMENTS_SUBMITTED" },
                })]
                : []),
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Respond Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
