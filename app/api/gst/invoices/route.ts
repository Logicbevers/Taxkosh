import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const itemSchema = z.object({
    description: z.string(),
    hsnSac: z.string().optional(),
    quantity: z.number().positive(),
    rate: z.number().positive(),
    taxableValue: z.number().nonnegative(),
    cgstRate: z.number().default(0),
    sgstRate: z.number().default(0),
    igstRate: z.number().default(0),
    cgstAmount: z.number().default(0),
    sgstAmount: z.number().default(0),
    igstAmount: z.number().default(0),
});

const invoiceSchema = z.object({
    type: z.enum(["SALES", "PURCHASE"]),
    invoiceNumber: z.string().min(1),
    date: z.string(), // ISO string
    counterpartyName: z.string().optional(),
    counterpartyGstin: z.string().optional(),
    items: z.array(itemSchema).min(1),
});

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = invoiceSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const data = parsed.data;

    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    data.items.forEach(item => {
        totalTaxable += item.taxableValue;
        totalCgst += item.cgstAmount;
        totalSgst += item.sgstAmount;
        totalIgst += item.igstAmount;
    });

    const totalAmount = totalTaxable + totalCgst + totalSgst + totalIgst;

    try {
        const invoice = await prisma.invoice.create({
            data: {
                userId: session.user.id,
                type: data.type,
                invoiceNumber: data.invoiceNumber,
                date: new Date(data.date),
                counterpartyName: data.counterpartyName || null,
                counterpartyGstin: data.counterpartyGstin || null,
                items: data.items as Prisma.InputJsonValue,
                totalTaxableValue: totalTaxable,
                totalCgst,
                totalSgst,
                totalIgst,
                totalAmount
            }
        });

        return NextResponse.json({ success: true, invoice });
    } catch (error) {
        console.error("Invoice Error:", error);
        return NextResponse.json({ error: "Failed to save invoice" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const month = searchParams.get("month"); // e.g. "2025-06"

    let dateFilter = {};
    if (month) {
        const [year, m] = month.split('-');
        dateFilter = {
            gte: new Date(parseInt(year, 10), parseInt(m, 10) - 1, 1),
            lt: new Date(parseInt(year, 10), parseInt(m, 10), 1),
        };
    }

    const invoices = await prisma.invoice.findMany({
        where: {
            userId: session.user.id,
            ...(type ? { type: type as any } : {}),
            ...(month ? { date: dateFilter } : {})
        },
        orderBy: { date: 'desc' }
    });

    return NextResponse.json({ invoices });
}
