import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TdsFormType, TdsReturnStatus } from "@prisma/client";
import { z } from "zod";

const createTdsReturnSchema = z.object({
    financialYear: z.string().regex(/^\d{4}-\d{2}$/, "Financial year must be in format YYYY-YY"),
    quarter: z.number().int().min(1).max(4),
    formType: z.nativeEnum(TdsFormType),
});

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const returns = await prisma.tdsReturn.findMany({
            where: { userId: session.user.id },
            include: {
                _count: {
                    select: { entries: true, challans: true }
                }
            }
        });
        return NextResponse.json(returns);
    } catch (error) {
        console.error("Fetch TDS returns error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const parsed = createTdsReturnSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { financialYear, quarter, formType } = parsed.data;

        const existing = await prisma.tdsReturn.findUnique({
            where: {
                userId_financialYear_quarter_formType: {
                    userId: session.user.id,
                    financialYear,
                    quarter,
                    formType,
                }
            }
        });

        if (existing) {
            return NextResponse.json({ error: "Return already exists for this period" }, { status: 409 });
        }

        const tdsReturn = await prisma.tdsReturn.create({
            data: {
                userId: session.user.id,
                financialYear,
                quarter,
                formType,
                status: TdsReturnStatus.DRAFT,
            }
        });

        return NextResponse.json(tdsReturn, { status: 201 });
    } catch (error) {
        console.error("Create TDS return error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
