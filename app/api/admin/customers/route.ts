import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

const VALID_ROLES = new Set(Object.values(UserRole));

export async function GET(req: Request) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const roleParam = searchParams.get("role");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25", 10)));

    const role =
        roleParam && VALID_ROLES.has(roleParam as UserRole)
            ? (roleParam as UserRole)
            : undefined;

    const where = {
        role: role ?? { in: [UserRole.INDIVIDUAL, UserRole.BUSINESS, UserRole.CA] },
        ...(search
            ? {
                OR: [
                    { name: { contains: search, mode: "insensitive" as const } },
                    { email: { contains: search, mode: "insensitive" as const } },
                ],
            }
            : {}),
    };

    const [customers, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                emailVerified: true,
                phone: true,
                pan: true,
                createdAt: true,
                _count: { select: { serviceRequests: true } },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.user.count({ where }),
    ]);

    // Never return encrypted PAN to admin list view
    const sanitised = customers.map(c => ({ ...c, pan: c.pan ? "••••••••••" : null }));

    return NextResponse.json({ customers: sanitised, total, page, limit });
}
