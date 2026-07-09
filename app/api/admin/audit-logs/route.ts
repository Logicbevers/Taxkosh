import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { AuditAction } from "@prisma/client";

const VALID_ACTIONS = new Set<string>(Object.values(AuditAction));

export async function GET(req: Request) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    const actionParam = searchParams.get("action");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));

    const action =
        actionParam && VALID_ACTIONS.has(actionParam)
            ? (actionParam as AuditAction)
            : undefined;

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where: { userId, action },
            include: {
                user: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.auditLog.count({ where: { userId, action } }),
    ]);

    return NextResponse.json({ logs, total, page, limit });
}
