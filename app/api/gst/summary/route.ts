import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // e.g. "2025-06"

    let dateFilter = {};
    if (month) {
        const [year, m] = month.split('-');
        dateFilter = {
            gte: new Date(parseInt(year, 10), parseInt(m, 10) - 1, 1),
            lt: new Date(parseInt(year, 10), parseInt(m, 10), 1),
        };
    }

    try {
        const salesAgg = await prisma.invoice.aggregate({
            _sum: {
                totalTaxableValue: true,
                totalCgst: true,
                totalSgst: true,
                totalIgst: true,
                totalAmount: true
            },
            where: {
                userId: session.user.id,
                type: 'SALES',
                ...(month ? { date: dateFilter } : {})
            }
        });

        const purchasesAgg = await prisma.invoice.aggregate({
            _sum: {
                totalTaxableValue: true,
                totalCgst: true,
                totalSgst: true,
                totalIgst: true,
                totalAmount: true
            },
            where: {
                userId: session.user.id,
                type: 'PURCHASE',
                ...(month ? { date: dateFilter } : {})
            }
        });

        const sales = {
            taxable: salesAgg._sum.totalTaxableValue || 0,
            cgst: salesAgg._sum.totalCgst || 0,
            sgst: salesAgg._sum.totalSgst || 0,
            igst: salesAgg._sum.totalIgst || 0,
            totalTax: (salesAgg._sum.totalCgst || 0) + (salesAgg._sum.totalSgst || 0) + (salesAgg._sum.totalIgst || 0),
            total: salesAgg._sum.totalAmount || 0,
        };

        const purchases = {
            taxable: purchasesAgg._sum.totalTaxableValue || 0,
            cgst: purchasesAgg._sum.totalCgst || 0,
            sgst: purchasesAgg._sum.totalSgst || 0,
            igst: purchasesAgg._sum.totalIgst || 0,
            totalTax: (purchasesAgg._sum.totalCgst || 0) + (purchasesAgg._sum.totalSgst || 0) + (purchasesAgg._sum.totalIgst || 0),
            total: purchasesAgg._sum.totalAmount || 0,
        };

        const netPayable = sales.totalTax - purchases.totalTax;

        return NextResponse.json({
            sales,
            purchases,
            netPayable: netPayable > 0 ? netPayable : 0,
            itcCarryForward: netPayable < 0 ? Math.abs(netPayable) : 0
        });
    } catch (error) {
        console.error("Summary Fetch Error:", error);
        return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
    }
}
