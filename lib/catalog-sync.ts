import { prisma } from "@/lib/prisma";

/**
 * Bridge between the admin-facing `CatalogNode` tree and the legacy
 * `Category` / `SubCategory` / `Service` tables that the PUBLIC site and the
 * payment flow (create-order → prisma.service) actually read.
 *
 * The admin manages the catalog via the CatalogNode tree, but nothing
 * user-facing reads that model — so admin edits never appeared on the public
 * site. Rather than rewrite the entire public + checkout + admin-ops surface
 * onto CatalogNode, we mirror each node into the legacy model on write.
 *
 * Only the first three levels map (the legacy model is strictly
 * category → subcategory → service):
 *   depth 0            → Category      (matched by slug)
 *   depth 1            → SubCategory   (matched by categoryId + name; no slug column)
 *   isLeaf (any depth) → Service       (matched by slug)
 *
 * A subcategory only surfaces publicly once it has an active service (the
 * public readers hide empty subcategories to avoid dead-end pages).
 */
export async function syncNodeToLegacy(nodeId: string): Promise<void> {
    const node = await prisma.catalogNode.findUnique({ where: { id: nodeId } });
    if (!node) return;

    try {
        // --- Category (depth 0) ---
        if (node.depth === 0 && !node.isLeaf) {
            await prisma.category.upsert({
                where: { slug: node.slug },
                update: {
                    name: node.name,
                    description: node.description,
                    status: node.status,
                    displayOrder: node.displayOrder,
                },
                create: {
                    name: node.name,
                    slug: node.slug,
                    description: node.description,
                    status: node.status,
                    displayOrder: node.displayOrder,
                },
            });
            return;
        }

        // --- SubCategory (depth 1, non-leaf) ---
        if (node.depth === 1 && !node.isLeaf && node.parentId) {
            const cat = await legacyCategoryForNode(node.parentId);
            if (!cat) return;
            const existing = await prisma.subCategory.findFirst({
                where: { categoryId: cat.id, name: node.name },
            });
            if (existing) {
                await prisma.subCategory.update({
                    where: { id: existing.id },
                    data: { description: node.description, status: node.status },
                });
            } else {
                await prisma.subCategory.create({
                    data: {
                        name: node.name,
                        categoryId: cat.id,
                        description: node.description,
                        status: node.status,
                    },
                });
            }
            return;
        }

        // --- Service (leaf) ---
        if (node.isLeaf && node.parentId) {
            const subNode = await prisma.catalogNode.findUnique({ where: { id: node.parentId } });
            if (!subNode || !subNode.parentId) return;
            const cat = await legacyCategoryForNode(subNode.parentId);
            if (!cat) return;
            const sub = await prisma.subCategory.findFirst({
                where: { categoryId: cat.id, name: subNode.name },
            });
            if (!sub) return;

            await prisma.service.upsert({
                where: { slug: node.slug },
                update: {
                    name: node.name,
                    description: node.description,
                    price: node.price,
                    slaHours: node.slaHours,
                    requiredDocuments: node.requiredDocuments,
                    status: node.status,
                    categoryId: cat.id,
                    subCategoryId: sub.id,
                },
                create: {
                    name: node.name,
                    slug: node.slug,
                    description: node.description,
                    price: node.price,
                    slaHours: node.slaHours,
                    requiredDocuments: node.requiredDocuments,
                    status: node.status,
                    categoryId: cat.id,
                    subCategoryId: sub.id,
                },
            });
        }
    } catch (err) {
        // Mirroring must never break the admin catalog write itself.
        console.error("Legacy catalog sync failed for node", nodeId, err);
    }
}

/** Resolve the legacy Category row for a CatalogNode category id (depth 0). */
async function legacyCategoryForNode(categoryNodeId: string) {
    const catNode = await prisma.catalogNode.findUnique({ where: { id: categoryNodeId } });
    if (!catNode) return null;
    return prisma.category.findUnique({ where: { slug: catNode.slug } });
}

/**
 * Best-effort removal of the legacy row mirrored from a CatalogNode, called
 * before the node itself is deleted. Failures are non-fatal.
 */
export async function deleteLegacyForNode(nodeId: string): Promise<void> {
    const node = await prisma.catalogNode.findUnique({ where: { id: nodeId } });
    if (!node) return;
    try {
        if (node.isLeaf) {
            await prisma.service.deleteMany({ where: { slug: node.slug } });
        } else if (node.depth === 0) {
            // Category cascade-deletes its subcategories/services in the legacy model.
            await prisma.category.deleteMany({ where: { slug: node.slug } });
        } else if (node.depth === 1 && node.parentId) {
            const cat = await legacyCategoryForNode(node.parentId);
            if (cat) {
                await prisma.subCategory.deleteMany({ where: { categoryId: cat.id, name: node.name } });
            }
        }
    } catch (err) {
        console.error("Legacy catalog delete-sync failed for node", nodeId, err);
    }
}
