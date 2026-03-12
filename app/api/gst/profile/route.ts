import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.gstProfile.findUnique({
        where: { userId: session.user.id }
    });

    return NextResponse.json({ profile });
}

const profileSchema = z.object({
    gstin: z.string().min(15).max(15),
    legalName: z.string().min(1),
    tradeName: z.string().optional(),
    address: z.string().optional(),
});

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { gstin, legalName, tradeName, address } = parsed.data;

    try {
        const profile = await prisma.gstProfile.upsert({
            where: { userId: session.user.id },
            update: { gstin, legalName, tradeName, address },
            create: { userId: session.user.id, gstin, legalName, tradeName, address },
        });

        // Update the User model so we know they are a business with a GSTIN
        await prisma.user.update({
            where: { id: session.user.id },
            data: { role: "BUSINESS", gstin }
        });

        return NextResponse.json({ success: true, profile });
    } catch (e) {
        console.error("GST Profile Save Error:", e);
        return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
    }
}
