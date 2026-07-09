import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
    planName: z.string().min(1).max(100),
    price: z.union([z.number(), z.string()]).transform(v => Number(v)).pipe(z.number().nonnegative().max(10_000_000)),
    description: z.string().max(2000).optional(),
    turnaroundTime: z.string().max(100).optional(),
    status: z.enum(["active", "inactive"]).default("active"),
});

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    try {
        const { id: serviceId } = await params;
        const plans = await prisma.servicePlan.findMany({
            where: { serviceId },
            orderBy: { price: "asc" },
        });
        return NextResponse.json(plans);
    } catch (error) {
        console.error("Fetch Service Plans Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    try {
        const { id: serviceId } = await params;
        const body = await req.json();
        const parsed = createSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const parent = await prisma.service.findUnique({ where: { id: serviceId } });
        if (!parent) {
            return NextResponse.json({ error: "Parent service does not exist" }, { status: 400 });
        }

        const plan = await prisma.servicePlan.create({
            data: { serviceId, ...parsed.data },
        });

        return NextResponse.json(plan);
    } catch (error) {
        console.error("Create Service Plan Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
