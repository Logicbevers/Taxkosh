import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * All server-side catalog fetchers used by the PUBLIC /services/* pages
 * and the navbar dropdown. All calls are wrapped in React.cache() so
 * multiple components on the same render tree share the same query.
 *
 * Data is pulled fresh on each request — since the admin UI can edit
 * the catalog at any time, ISR/build-caching would show stale data.
 */

// A subcategory only counts as "public" when it has at least one active service.
// Empty / test subcategories are never surfaced to end users (admins still see them).
const nonEmptyActiveSub = {
    status: "active" as const,
    services: { some: { status: "active" as const } },
};

export const getPublicCategories = cache(async () => {
    const cats = await prisma.category.findMany({
        where: {
            status: "active",
            // Only show categories that have at least one non-empty active subcategory.
            subCategories: { some: nonEmptyActiveSub },
        },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        include: {
            subCategories: {
                where: nonEmptyActiveSub,
                orderBy: { createdAt: "asc" },
                include: {
                    _count: { select: { services: { where: { status: "active" } } } },
                },
            },
        },
    });
    // Expose a real count field the pages can trust.
    return cats.map(c => ({ ...c, _count: { subCategories: c.subCategories.length } }));
});

export const getPublicCategoryBySlug = cache(async (slug: string) => {
    return prisma.category.findFirst({
        where: { slug, status: "active" },
        include: {
            subCategories: {
                where: nonEmptyActiveSub,
                orderBy: { createdAt: "asc" },
                include: {
                    services: {
                        where: { status: "active" },
                        orderBy: { createdAt: "asc" },
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            description: true,
                            price: true,
                            slaHours: true,
                        },
                    },
                },
            },
        },
    });
});

export const getPublicSubCategory = cache(async (categorySlug: string, subSlug: string) => {
    const category = await prisma.category.findFirst({
        where: { slug: categorySlug, status: "active" },
        select: { id: true, name: true, slug: true },
    });
    if (!category) return null;

    // SubCategory has no unique slug column, look up by name-slug matching
    const subCategories = await prisma.subCategory.findMany({
        where: { categoryId: category.id, status: "active" },
        include: {
            services: {
                where: { status: "active" },
                orderBy: { createdAt: "asc" },
                select: {
                    id: true, name: true, slug: true, description: true,
                    price: true, slaHours: true,
                },
            },
        },
    });
    const sub = subCategories.find(s => nameToSlug(s.name) === subSlug);
    // Treat an empty subcategory as not-found so users never land on a dead page.
    if (!sub || sub.services.length === 0) return null;
    return { category, sub };
});

export const getPublicService = cache(async (
    categorySlug: string,
    subSlug: string,
    serviceSlug: string
) => {
    const service = await prisma.service.findFirst({
        where: { slug: serviceSlug, status: "active" },
        include: {
            subCategory: {
                include: {
                    category: true,
                },
            },
        },
    });
    if (!service) return null;

    // Guard against URL slug mismatches
    const parentCategory = service.subCategory.category;
    if (parentCategory.slug !== categorySlug) return null;
    if (nameToSlug(service.subCategory.name) !== subSlug) return null;

    return service;
});

/** Normalise a display name into a URL-safe slug */
export function nameToSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
