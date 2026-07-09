import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    try {
        const user = await prisma.user.findUnique({
            where: { id: guard.session.user.id },
            select: { phone: true, phoneVerified: true },
        });

        return NextResponse.json({
            phoneVerified: !!user?.phoneVerified,
            phone: user?.phone ?? null,
        });
    } catch (error) {
        console.error("Phone Status Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
