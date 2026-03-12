import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const documents = await prisma.document.findMany({
            where: { userId: session.user.id },
            orderBy: { uploadedAt: "desc" },
        });

        return NextResponse.json({ documents });
    } catch (error) {
        console.error("[Documents List Error]", error);
        return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
    }
}
