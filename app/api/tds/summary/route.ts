import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const fy = searchParams.get("fy") || "2024-25";

        // Aggregate entries and challans for the financial year
        const entries = await prisma.tdsEntry.aggregate({
            _sum: { totalTds: true },
            where: {
                tdsReturn: {
                    userId: session.user.id,
                    financialYear: fy
                }
            }
        });

        const challans = await prisma.tdsChallan.aggregate({
            _sum: { amount: true },
            where: {
                tdsReturn: {
                    userId: session.user.id,
                    financialYear: fy
                }
            }
        });

        const totalLiability = entries._sum.totalTds || 0;
        const totalDeposited = challans._sum.amount || 0;
        const pendingDeposit = totalLiability - totalDeposited;

        // Estimated Interest Logic (Phase 14)
        // If there's a pending deposit, we estimate interest for the "delayed payment"
        // In a real scenario, we'd check against each entry's specific due date.
        let estimatedInterest = 0;
        if (pendingDeposit > 0) {
            // Simplified: 1.5% for 1 partial month for the pending amount
            estimatedInterest = Math.round(pendingDeposit * 0.015);
        }

        const summary = {
            totalLiability,
            totalDeposited,
            pendingDeposit,
            estimatedInterest,
            totalPayable: pendingDeposit + estimatedInterest
        };

        return NextResponse.json(summary);
    } catch (error) {
        console.error("Fetch TDS summary error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
