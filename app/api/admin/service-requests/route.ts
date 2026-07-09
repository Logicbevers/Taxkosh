import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { ServiceRequestStatus } from "@prisma/client";
import { maskPAN } from "@/lib/security";
import { computeSla } from "@/lib/sla";

export async function GET(req: Request) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || undefined;
    const statusParam = searchParams.get("status");
    const serviceId = searchParams.get("serviceId") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));

    const VALID_STATUSES = new Set<string>(Object.values(ServiceRequestStatus));
    const status =
        statusParam && VALID_STATUSES.has(statusParam)
            ? (statusParam as ServiceRequestStatus)
            : undefined;

    try {
        type WhereClause = {
            id?: string;
            status?: ServiceRequestStatus;
            serviceId?: string;
            service?: { categoryId: string };
        };
        const where: WhereClause = {};
        if (id) where.id = id;
        if (status) where.status = status;
        if (serviceId) where.serviceId = serviceId;
        if (categoryId) where.service = { categoryId };

        const [requests, total] = await Promise.all([
            prisma.serviceRequest.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            pan: true,
                            phone: true,
                        },
                    },
                    service: true,
                    plan: true,
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.serviceRequest.count({ where }),
        ]);

        const enhancedRequests = requests.map(r => {
            // Mask PAN before returning to client
            if (r.user?.pan) {
                (r.user as typeof r.user & { pan: string }).pan = maskPAN(r.user.pan);
            }
            const { hoursElapsed, slaStatus } = computeSla(r);
            return { ...r, hoursElapsed, slaStatus };
        });

        return NextResponse.json({ requests: enhancedRequests, total, page, limit });
    } catch (error) {
        console.error("Admin Service Requests Fetch Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
