import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET(req: Request) {
    const session = await auth();
    const userRole = session?.user?.role;

    // Only allow Admin, Tax Executive, and Senior Reviewer
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.TAX_EXECUTIVE, UserRole.SENIOR_REVIEWER];
    if (!session?.user?.id || !allowedRoles.includes(userRole as UserRole)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const assignedToId = searchParams.get("assignedToId");

    try {
        const where: any = {};
        if (id) where.id = id;
        if (status) where.status = status;
        if (category) where.category = category;
        if (assignedToId) where.assignedToId = assignedToId;

        const requests = await prisma.serviceRequest.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        pan: true,
                    }
                }
            },
            orderBy: { createdAt: "desc" },
        });

        // Add SLA info (hours elapsed)
        const timelineRequests = requests.map(r => {
            const hoursElapsed = Math.floor((new Date().getTime() - r.createdAt.getTime()) / (1000 * 60 * 60));
            return {
                ...r,
                hoursElapsed,
                slaStatus: hoursElapsed > 48 ? "CRITICAL" : hoursElapsed > 24 ? "WARNING" : "HEALTHY"
            };
        });

        return NextResponse.json(timelineRequests);
    } catch (error) {
        console.error("Admin Services Fetch Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
