import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createNodeSchema = z.object({
    name: z.string().min(1).max(200),
    slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
    parentId: z.string().nullable().optional(),
    displayOrder: z.number().int().min(0).default(0),
    isLeaf: z.boolean().default(false),
    price: z.number().min(0).default(0),
    description: z.string().max(2000).optional(),
    requiredDocuments: z.array(z.string()).default([]),
    slaHours: z.number().int().min(1).max(720).default(24),
    status: z.enum(["active", "inactive"]).default("active"),
});

export async function GET() {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    try {
        // Return flat list; client builds the tree
        const nodes = await prisma.catalogNode.findMany({
            orderBy: [{ depth: "asc" }, { displayOrder: "asc" }, { name: "asc" }],
        });
        return NextResponse.json(nodes);
    } catch (error) {
        console.error("Fetch CatalogNodes Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    try {
        const body = await req.json();
        const parsed = createNodeSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { name, slug, parentId, displayOrder, isLeaf, price, description, requiredDocuments, slaHours, status } =
            parsed.data;

        // Determine depth from parent and validate parent is not a leaf
        let depth = 0;
        if (parentId) {
            const parent = await prisma.catalogNode.findUnique({ where: { id: parentId } });
            if (!parent) return NextResponse.json({ error: "Parent not found" }, { status: 404 });
            if (parent.isLeaf) {
                return NextResponse.json({ error: "Cannot add children to a service node." }, { status: 409 });
            }
            depth = parent.depth + 1;
        }

        const node = await prisma.catalogNode.create({
            data: { name, slug, parentId: parentId ?? null, depth, displayOrder, isLeaf, price, description, requiredDocuments, slaHours, status },
        });

        return NextResponse.json(node, { status: 201 });
    } catch (error: unknown) {
        if ((error as { code?: string }).code === "P2002") {
            return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
        }
        console.error("Create CatalogNode Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
