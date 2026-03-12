import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole, ServiceRequestStatus } from "@prisma/client";

/**
 * Handle individual service request management (status updates, etc.)
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    const userRole = session?.user?.role;
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.TAX_EXECUTIVE, UserRole.SENIOR_REVIEWER];

    if (!session?.user?.id || !allowedRoles.includes(userRole as UserRole)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { id } = await params;
        const { status } = await req.json();

        if (!status) {
            return NextResponse.json({ error: "Status is required" }, { status: 400 });
        }

        const updatedRequest = await prisma.serviceRequest.update({
            where: { id },
            data: { status: status as ServiceRequestStatus }
        });

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
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const request = await prisma.serviceRequest.findUnique({
            where: { id },
            include: {
                user: true,
                assignedTo: true,
                notes: { orderBy: { createdAt: "desc" } },
                documents: true
            }
        });

        if (!request) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        return NextResponse.json(request);
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
