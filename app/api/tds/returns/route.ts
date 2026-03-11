import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TdsFormType, TdsReturnStatus } from "@prisma/client";

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
        const { financialYear, quarter, formType } = body;

        if (!financialYear || !quarter || !formType) {
            return NextResponse.json({ error: "FY, Quarter and Form Type are required" }, { status: 400 });
        }

        // Check if return already exists for this period/type
        const existing = await prisma.tdsReturn.findUnique({
            where: {
                userId_financialYear_quarter_formType: {
                    userId: session.user.id,
                    financialYear,
                    quarter,
                    formType: formType as TdsFormType
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
                formType: formType as TdsFormType,
                status: TdsReturnStatus.DRAFT
            }
        });

        return NextResponse.json(tdsReturn, { status: 201 });
    } catch (error) {
        console.error("Create TDS return error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
