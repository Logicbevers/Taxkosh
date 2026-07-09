import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).nullable().optional(),
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

        const subCategory = await prisma.subCategory.update({
            where: { id },
            data: parsed.data,
        });

        return NextResponse.json(subCategory);
    } catch (error) {
        console.error("Update SubCategory Error:", error);
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
        const svcCount = await prisma.service.count({ where: { subCategoryId: id } });
        if (svcCount > 0) {
            return NextResponse.json(
                { error: `Cannot delete: ${svcCount} services exist. Delete them first or deactivate instead.` },
                { status: 409 }
            );
        }

        await prisma.subCategory.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete SubCategory Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
