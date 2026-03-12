import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    const userRole = session?.user?.role;

    if (!session?.user?.id || userRole !== UserRole.ADMIN) {
        return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 403 });
    }

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
