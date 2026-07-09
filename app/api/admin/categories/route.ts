import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

const createCategorySchema = z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens only"),
    description: z.string().max(500).optional(),
    displayOrder: z.number().int().min(0).optional(),
    status: z.enum(["active", "inactive"]).optional(),
});

export async function GET() {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    try {
        const categories = await prisma.category.findMany({
            include: {
                subCategories: {
                    orderBy: { createdAt: "asc" }
                }
            },
            orderBy: { displayOrder: "asc" }
        });
        return NextResponse.json(categories);
    } catch (error) {
        console.error("Fetch Categories Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    try {
        const body = await req.json();
        const parsed = createCategorySchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { name, slug, description, displayOrder, status } = parsed.data;

        const category = await prisma.category.create({
            data: {
                name,
                slug,
                description,
                displayOrder: displayOrder ?? 0,
                status: status ?? "active",
            },
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("Create Category Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
