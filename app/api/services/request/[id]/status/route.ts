import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import z from "zod";

const updateStatusSchema = z.object({
    status: z.enum([
        "PENDING_DOCUMENTS",
        "DOCUMENTS_SUBMITTED",
        "UNDER_REVIEW",
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
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const json = await req.json();
        const body = updateStatusSchema.parse(json);

        const existing = await prisma.serviceRequest.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Must own the request to update status for now (or be admin in a real app)
        if (existing.userId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updatedRequest = await prisma.serviceRequest.update({
            where: {
                id,
            },
            data: {
                status: body.status,
            },
        });

        return NextResponse.json(updatedRequest);
    } catch (error: any) {
        console.error("Failed to update status:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
