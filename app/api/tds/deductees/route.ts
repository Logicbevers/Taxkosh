import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/security";

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
        const { name, pan, category } = body;

        if (!name || !pan) {
            return NextResponse.json({ error: "Name and PAN are required" }, { status: 400 });
        }

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
