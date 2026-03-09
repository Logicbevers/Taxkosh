import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");

    const logs = await prisma.auditLog.findMany({
        where: {
            userId: userId || undefined,
            action: (action as any) || undefined,
        },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                }
            }
        },
        orderBy: { createdAt: "desc" },
        take: 100
    });

    return NextResponse.json(logs);
}
