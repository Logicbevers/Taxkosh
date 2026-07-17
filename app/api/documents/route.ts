import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    try {
        const documents = await prisma.document.findMany({
            where: { userId: guard.session.user.id },
            orderBy: { uploadedAt: "desc" },
        });

        return NextResponse.json({ documents });
    } catch (error) {
        console.error("[Documents List Error]", error);
        return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
    }
}
