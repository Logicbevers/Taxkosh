import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().max(500).nullable().optional(),
    displayOrder: z.number().int().min(0).optional(),
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

        // If slug is being changed, ensure it's unique
        if (parsed.data.slug) {
            const existing = await prisma.category.findFirst({
                where: { slug: parsed.data.slug, NOT: { id } },
            });
            if (existing) {
                return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
            }
        }

        const category = await prisma.category.update({
            where: { id },
            data: parsed.data,
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("Update Category Error:", error);
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

        // Block delete if there are sub-categories
        const subCount = await prisma.subCategory.count({ where: { categoryId: id } });
        if (subCount > 0) {
            return NextResponse.json(
                { error: `Cannot delete: ${subCount} sub-categories exist. Delete them first or deactivate instead.` },
                { status: 409 }
            );
        }

        await prisma.category.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Category Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
