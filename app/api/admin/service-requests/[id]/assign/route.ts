import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    try {
        const { assignedToId } = await req.json();
        const resolvedParams = await params;

        const updatedRequest = await prisma.serviceRequest.update({
            where: { id: resolvedParams.id },
            data: { assignedToId }
        });

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error("Assignment Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
