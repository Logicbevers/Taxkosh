import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const taxReturn = await prisma.taxReturn.findFirst({
            where: { userId: session.user.id },
            orderBy: { updatedAt: "desc" },
        });

        return NextResponse.json({ taxReturn });
    } catch (error) {
        console.error("[ITR Latest Error]", error);
        return NextResponse.json({ error: "Failed to fetch ITR" }, { status: 500 });
    }
}
