import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/security";
import { z } from "zod";

const createDeducteeSchema = z.object({
    name: z.string().min(1).max(200),
    pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN format"),
    category: z.enum(["COMPANY", "NON_COMPANY"]).default("NON_COMPANY"),
});

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const deductees = await prisma.tdsDeductee.findMany({
            where: { userId: session.user.id }
        });
        return NextResponse.json(deductees);
    } catch (error) {
        console.error("Fetch deductees error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const parsed = createDeducteeSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { name, pan, category } = parsed.data;

        const encryptedPan = encrypt(pan);

        const deductee = await prisma.tdsDeductee.create({
            data: {
                userId: session.user.id,
                name,
                pan: encryptedPan,
                category
            }
        });

        return NextResponse.json(deductee, { status: 201 });
    } catch (error) {
        console.error("Create deductee error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
