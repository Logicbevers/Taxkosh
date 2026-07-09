import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
    categoryId: z.string().min(1).optional(),
    subCategoryId: z.string().min(1).optional(),
    description: z.string().max(2000).nullable().optional(),
    requiredDocuments: z.array(z.string()).optional(),
    price: z.number().min(0).optional(),
    slaHours: z.number().int().min(1).max(720).optional(),
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

        if (parsed.data.slug) {
            const existing = await prisma.service.findFirst({
                where: { slug: parsed.data.slug, NOT: { id } },
            });
            if (existing) {
                return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
            }
        }

        const service = await prisma.service.update({
            where: { id },
            data: parsed.data,
        });

        return NextResponse.json(service);
    } catch (error) {
        console.error("Update Service Error:", error);
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
        const reqCount = await prisma.serviceRequest.count({ where: { serviceId: id } });
        if (reqCount > 0) {
            return NextResponse.json(
                { error: `Cannot delete: ${reqCount} active service requests exist. Deactivate instead.` },
                { status: 409 }
            );
        }

        await prisma.service.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Service Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
