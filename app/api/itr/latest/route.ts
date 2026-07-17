import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    try {
        const taxReturn = await prisma.taxReturn.findFirst({
            where: { userId: guard.session.user.id },
            orderBy: { updatedAt: "desc" },
        });

        return NextResponse.json({ taxReturn });
    } catch (error) {
        console.error("[ITR Latest Error]", error);
        return NextResponse.json({ error: "Failed to fetch ITR" }, { status: 500 });
    }
}
