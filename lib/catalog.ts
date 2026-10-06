import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Server-side catalog fetchers for the PUBLIC /services/* pages and navbar.
 *
 * Source of truth is the CatalogNode tree — the same model the admin Catalog panel
 * writes to — so a service added in the admin console appears on the site with no
 * sync step. (Previously these read the legacy Category/SubCategory/Service tables,
 * which the admin panel never touched, so admin-added services never showed up.)
 *
 * Tree shape: depth 0 = category, depth 1 = sub-category, leaf = a purchasable
 * service. These helpers return the legacy-compatible shapes the pages already
 * consume, so the page components barely change. Every call is React.cache()'d and
 * pulled fresh per request (admins edit the catalog live, so no build caching).
 */

const ACTIVE = "active" as const;

type ServiceShape = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    slaHours: number;
    requiredDocuments: string[];
};

// A sub-category is only "public" when it has at least one active leaf (a real,
// buyable service). Empty branches are hidden from end users, same rule as before.
const activeLeafChildren = {
    where: { status: ACTIVE, isLeaf: true },
    orderBy: [{ displayOrder: "asc" as const }, { createdAt: "asc" as const }],
};

function toService(n: {
    id: string; name: string; slug: string; description: string | null;
    price: number; slaHours: number; requiredDocuments: string[];
}): ServiceShape {
    return {
        id: n.id, name: n.name, slug: n.slug, description: n.description,
        price: n.price, slaHours: n.slaHours, requiredDocuments: n.requiredDocuments,
    };
}

export const getPublicCategories = cache(async () => {
    const cats = await prisma.catalogNode.findMany({
        where: { depth: 0, status: ACTIVE },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        include: {
            children: {
                where: { status: ACTIVE },
                include: { children: activeLeafChildren },
            },
        },
    });

    return cats
        .map((c) => {
            const subsWithServices = c.children.filter((s) => !s.isLeaf && s.children.length > 0);
            // Services placed directly under the category (leaf at depth 1, no sub).
            const directServiceCount = c.children.filter((s) => s.isLeaf && s.status === ACTIVE).length;
            return {
                id: c.id,
                name: c.name,
                slug: c.slug,
                description: c.description,
                // Lightweight sub list (the landing section shows a few names);
                // _count kept for the services index page's "N types" label.
                subCategories: subsWithServices.map((s) => ({ id: s.id, name: s.name, slug: s.slug })),
                _count: { subCategories: subsWithServices.length },
                // Visible when the category has ANY buyable service — under a
                // sub-category OR directly beneath it. The old filter only counted
                // the former, so a category with a direct service was hidden here
                // even though its detail page listed it.
                hasServices: subsWithServices.length > 0 || directServiceCount > 0,
            };
        })
        .filter((c) => c.hasServices);
});

export const getPublicCategoryBySlug = cache(async (slug: string) => {
    const category = await prisma.catalogNode.findFirst({
        where: { slug, depth: 0, status: ACTIVE },
        include: {
            children: {
                where: { status: ACTIVE },
                orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
                include: { children: activeLeafChildren },
            },
        },
    });
    if (!category) return null;

    return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        subCategories: category.children
            // A non-leaf child with at least one buyable leaf is a sub-category.
            .filter((sub) => !sub.isLeaf && sub.children.length > 0)
            .map((sub) => ({
                id: sub.id,
                name: sub.name,
                slug: sub.slug,
                description: sub.description,
                services: sub.children.map(toService),
            })),
        // The admin catalog is unlimited-depth: a service can sit directly under a
        // category (a leaf at depth 1, no sub-category). Surface those too, or they'd
        // silently never appear on the site.
        directServices: category.children
            .filter((n) => n.isLeaf && n.status === ACTIVE)
            .map(toService),
    };
});

export const getPublicSubCategory = cache(async (categorySlug: string, subSlug: string) => {
    const category = await prisma.catalogNode.findFirst({
        where: { slug: categorySlug, depth: 0, status: ACTIVE },
        select: { id: true, name: true, slug: true },
    });
    if (!category) return null;

    const sub = await prisma.catalogNode.findFirst({
        where: { slug: subSlug, parentId: category.id, status: ACTIVE },
        include: { children: activeLeafChildren },
    });
    // Treat an empty sub-category as not-found so users never hit a dead page.
    if (!sub || sub.children.length === 0) return null;

    return {
        category,
        sub: {
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            description: sub.description,
            services: sub.children.map(toService),
        },
    };
});

/**
 * A service leaf sitting directly under a category (depth 1, no sub-category). Its
 * public URL is /services/[category]/[service] — two segments — so it arrives at the
 * [sub] route, which falls back to this when the slug isn't a sub-category.
 */
export const getPublicDirectService = cache(async (categorySlug: string, serviceSlug: string) => {
    const category = await prisma.catalogNode.findFirst({
        where: { slug: categorySlug, depth: 0, status: ACTIVE },
        select: { id: true, name: true, slug: true },
    });
    if (!category) return null;

    const leaf = await prisma.catalogNode.findFirst({
        where: { slug: serviceSlug, parentId: category.id, isLeaf: true, status: ACTIVE },
    });
    if (!leaf) return null;

    return { category, service: toService(leaf) };
});

export const getPublicService = cache(async (
    categorySlug: string,
    subSlug: string,
    serviceSlug: string
) => {
    const service = await prisma.catalogNode.findFirst({
        where: { slug: serviceSlug, isLeaf: true, status: ACTIVE },
        include: { parent: { include: { parent: true } } },
    });
    if (!service) return null;

    const sub = service.parent;
    const category = sub?.parent;
    // Guard against URL/slug mismatches and orphaned nodes.
    if (!sub || sub.status !== ACTIVE || sub.slug !== subSlug) return null;
    if (!category || category.status !== ACTIVE || category.slug !== categorySlug) return null;

    // Shape mirrors the old `service.subCategory.category` nesting the page reads.
    return {
        id: service.id,
        name: service.name,
        slug: service.slug,
        description: service.description,
        price: service.price,
        slaHours: service.slaHours,
        requiredDocuments: service.requiredDocuments,
        subCategory: {
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            category: {
                id: category.id,
                name: category.name,
                slug: category.slug,
            },
        },
    };
});

/** Normalise a display name into a URL-safe slug */
export function nameToSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
