import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { syncNodeToLegacy, deleteLegacyForNode } from "@/lib/catalog-sync";

const patchSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
    displayOrder: z.number().int().min(0).optional(),
    isLeaf: z.boolean().optional(),
    price: z.number().min(0).optional(),
    description: z.string().max(2000).optional(),
    requiredDocuments: z.array(z.string()).optional(),
    slaHours: z.number().int().min(1).max(720).optional(),
    status: z.enum(["active", "inactive"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const { id } = await params;

    try {
        const body = await req.json();
        const parsed = patchSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        // Guard: cannot mark a node that has children as a leaf
        if (parsed.data.isLeaf === true) {
            const childCount = await prisma.catalogNode.count({ where: { parentId: id } });
            if (childCount > 0) {
                return NextResponse.json(
                    { error: "Cannot mark a node with children as a service. Delete children first." },
                    { status: 409 }
                );
            }
        }

        const node = await prisma.catalogNode.update({
            where: { id },
            data: parsed.data,
        });

        // Keep the legacy mirror the public site reads in sync.
        await syncNodeToLegacy(node.id);

        return NextResponse.json(node);
    } catch (error: unknown) {
        if ((error as { code?: string }).code === "P2025") {
            return NextResponse.json({ error: "Node not found" }, { status: 404 });
        }
        if ((error as { code?: string }).code === "P2002") {
            return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
        }
        console.error("Update CatalogNode Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard.response;

    const { id } = await params;

    try {
        const node = await prisma.catalogNode.findUnique({
            where: { id },
            include: { _count: { select: { children: true, serviceRequests: true } } },
        });

        if (!node) return NextResponse.json({ error: "Node not found" }, { status: 404 });
        if (node._count.children > 0) {
            return NextResponse.json({ error: "Cannot delete a node that has children. Delete children first." }, { status: 409 });
        }
        if (node._count.serviceRequests > 0) {
            return NextResponse.json({ error: "Cannot delete a node with existing service requests." }, { status: 409 });
        }

        // Remove the legacy mirror first (best-effort), then the node.
        await deleteLegacyForNode(id);
        await prisma.catalogNode.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Delete CatalogNode Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
