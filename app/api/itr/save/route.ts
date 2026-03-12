import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma, $Enums } from "@prisma/client";

const saveSchema = z.object({
    assessmentYear: z.string().default("2025-26"),
    personalData: z.record(z.unknown()).optional(),
    incomeData: z.record(z.unknown()).optional(),
    deductionsData: z.record(z.unknown()).optional(),
    netTaxLiability: z.number().optional(),
    grossTaxLiability: z.number().optional(),
    selectedRegime: z.enum(["NEW", "OLD"]).optional(),
});

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = saveSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const {
        assessmentYear,
        personalData,
        incomeData,
        deductionsData,
        netTaxLiability,
        grossTaxLiability,
        selectedRegime,
    } = parsed.data;

    const regime = selectedRegime as $Enums.TaxRegime | undefined;

    // Cast to Prisma.InputJsonValue for JSON columns
    const personalJson = (personalData ?? {}) as Prisma.InputJsonValue;
    const incomeJson = (incomeData ?? {}) as Prisma.InputJsonValue;
    const deductionsJson = (deductionsData ?? {}) as Prisma.InputJsonValue;

    try {
        const taxReturn = await prisma.taxReturn.upsert({
            where: {
                userId_assessmentYear: {
                    userId: session.user.id,
                    assessmentYear,
                },
            },
            update: {
                personalData: personalData !== undefined ? personalJson : undefined,
                incomeData: incomeData !== undefined ? incomeJson : undefined,
                deductionsData: deductionsData !== undefined ? deductionsJson : undefined,
                netTaxLiability: netTaxLiability,
                grossTaxLiability: grossTaxLiability,
                selectedRegime: regime,
            },
            create: {
                userId: session.user.id,
                assessmentYear,
                personalData: personalJson,
                incomeData: incomeJson,
                deductionsData: deductionsJson,
                netTaxLiability: netTaxLiability,
                grossTaxLiability: grossTaxLiability,
                selectedRegime: regime,
            },
        });

        return NextResponse.json({ success: true, taxReturn });
    } catch (error) {
        console.error("[ITR Save Error]", error);
        return NextResponse.json({ error: "Failed to save ITR" }, { status: 500 });
    }
}
