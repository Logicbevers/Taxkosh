import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
    planName: z.string().min(1).max(100).optional(),
    price: z.union([z.number(), z.string()]).transform(v => Number(v)).pipe(z.number().nonnegative().max(10_000_000)).optional(),
    description: z.string().max(2000).nullable().optional(),
    turnaroundTime: z.string().max(100).nullable().optional(),
    status: z.enum(["active", "inactive"]).optional(),
});

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    try {
        const { id } = await params;
        const body = await req.json();
        const parsed = patchSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const plan = await prisma.servicePlan.update({
            where: { id },
            data: parsed.data,
        });

        return NextResponse.json(plan);
    } catch (error) {
        console.error("Update Service Plan Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    try {
        const { id } = await params;
        const reqCount = await prisma.serviceRequest.count({ where: { planId: id } });
        if (reqCount > 0) {
            return NextResponse.json(
                { error: `Cannot delete: ${reqCount} requests use this plan. Deactivate instead.` },
                { status: 409 }
            );
        }

        await prisma.servicePlan.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Service Plan Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
