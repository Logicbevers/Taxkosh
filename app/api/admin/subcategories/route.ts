import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
    name: z.string().min(1).max(100),
    categoryId: z.string().min(1),
    description: z.string().max(500).optional(),
    status: z.enum(["active", "inactive"]).default("active"),
});

export async function POST(req: Request) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    try {
        const body = await req.json();
        const parsed = createSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        // Verify parent category exists
        const parent = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
        if (!parent) {
            return NextResponse.json({ error: "Parent category does not exist" }, { status: 400 });
        }

        const subCategory = await prisma.subCategory.create({ data: parsed.data });
        return NextResponse.json(subCategory);
    } catch (error) {
        console.error("Create SubCategory Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
