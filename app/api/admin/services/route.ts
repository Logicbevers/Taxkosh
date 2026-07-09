import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createServiceSchema = z.object({
    name: z.string().min(1).max(200),
    slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
    categoryId: z.string().min(1),
    subCategoryId: z.string().min(1),
    description: z.string().max(2000).optional(),
    requiredDocuments: z.array(z.string()).default([]),
    price: z.number().min(0).default(0),
    slaHours: z.number().int().min(1).max(720).default(24),
    status: z.enum(["active", "inactive"]).default("active"),
});

export async function GET() {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    try {
        const services = await prisma.service.findMany({
            include: {
                subCategory: {
                    include: {
                        category: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json(services);
    } catch (error) {
        console.error("Fetch Services Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    try {
        const body = await req.json();
        const parsed = createServiceSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { name, slug, categoryId, subCategoryId, description, requiredDocuments, price, slaHours, status } = parsed.data;

        const service = await prisma.service.create({
            data: { name, slug, categoryId, subCategoryId, description, requiredDocuments, price, slaHours, status }
        });

        return NextResponse.json(service);
    } catch (error) {
        console.error("Create Service Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
