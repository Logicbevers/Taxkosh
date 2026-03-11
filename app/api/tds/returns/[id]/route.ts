import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateTds } from "@/lib/tds";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const resolvedParams = await params;
        const tdsReturn = await prisma.tdsReturn.findFirst({
            where: { id: resolvedParams.id, userId: session.user.id },
            include: {
                entries: { include: { deductee: true } },
                challans: true
            }
        });

        if (!tdsReturn) return NextResponse.json({ error: "Return not found" }, { status: 404 });

        return NextResponse.json(tdsReturn);
    } catch (error) {
        console.error("Fetch TDS return details error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * Add an Entry or Challan to the return
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { type } = body; // 'ENTRY' or 'CHALLAN'

        const resolvedParams = await params;
        const tdsReturn = await prisma.tdsReturn.findFirst({
            where: { id: resolvedParams.id, userId: session.user.id }
        });

        if (!tdsReturn) return NextResponse.json({ error: "Return not found" }, { status: 404 });

        if (type === "ENTRY") {
            const { deducteeId, sectionCode, dateOfPayment, amountPaid, tdsRate } = body;

            const deductee = await prisma.tdsDeductee.findUnique({
                where: { id: deducteeId }
            });

            if (!deductee) return NextResponse.json({ error: "Deductee not found" }, { status: 400 });

            const calc = calculateTds(amountPaid, tdsRate, deductee.category === "COMPANY");

            const entry = await prisma.tdsEntry.create({
                data: {
                    tdsReturn: { connect: { id: resolvedParams.id } },
                    deductee: { connect: { id: deducteeId } },
                    sectionCode,
                    dateOfPayment: new Date(dateOfPayment),
                    amountPaid,
                    tdsRate,
                    tdsAmount: calc.basicTax,
                    surcharge: calc.surcharge,
                    educationCess: calc.educationCess,
                    totalTds: calc.totalTds
                }
            });
            return NextResponse.json(entry);
        } else if (type === "CHALLAN") {
            const { bsrCode, dateOfDeposit, challanSerial, amount, interest, penalty } = body;

            const challan = await prisma.tdsChallan.create({
                data: {
                    tdsReturn: { connect: { id: resolvedParams.id } },
                    bsrCode,
                    dateOfDeposit: new Date(dateOfDeposit),
                    challanSerial,
                    amount,
                    interest: interest || 0,
                    penalty: penalty || 0
                }
            });
            return NextResponse.json(challan);
        }

        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    } catch (error) {
        console.error("Update TDS return error:", error);
        return NextResponse.json({ error: "Internal server error", details: (error as Error).message }, { status: 500 });
    }
}
