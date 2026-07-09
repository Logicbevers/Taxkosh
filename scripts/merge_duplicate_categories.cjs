/**
 * One-time data repair: merge duplicate categories (same name, different slug)
 * created by repeated seeding. Moves their sub-categories & services into the
 * canonical category, then deletes the emptied duplicates.
 *
 * Safe to re-run: it's idempotent (no dupes → no-op).
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function norm(s) { return s.toLowerCase().trim(); }

(async () => {
    const cats = await prisma.category.findMany({
        include: { subCategories: { include: { services: true } } },
        orderBy: { createdAt: 'asc' },
    });

    // Group by normalized name
    const groups = new Map();
    for (const c of cats) {
        const key = norm(c.name);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(c);
    }

    let mergedCats = 0, movedSubs = 0, movedServices = 0, deletedSubs = 0;

    for (const [name, list] of groups) {
        if (list.length < 2) continue;

        // Canonical = the one with the cleanest slug (no timestamp), else oldest
        const canonical =
            list.find(c => /^[a-z-]+$/.test(c.slug)) ?? list[0];
        const dupes = list.filter(c => c.id !== canonical.id);
        console.log(`\nMerging "${name}": keeping ${canonical.slug}, folding ${dupes.length} dupes`);

        // Re-read canonical subs fresh (a Map by normalized name)
        const canonicalSubs = new Map(
            canonical.subCategories.map(s => [norm(s.name), s])
        );

        for (const dupe of dupes) {
            for (const sub of dupe.subCategories) {
                const existing = canonicalSubs.get(norm(sub.name));
                if (existing) {
                    // Move this sub's services into the existing canonical sub
                    for (const svc of sub.services) {
                        await prisma.service.update({
                            where: { id: svc.id },
                            data: { categoryId: canonical.id, subCategoryId: existing.id },
                        });
                        movedServices++;
                    }
                    await prisma.subCategory.delete({ where: { id: sub.id } });
                    deletedSubs++;
                } else {
                    // Re-point the whole sub (and its services) to canonical
                    await prisma.subCategory.update({
                        where: { id: sub.id },
                        data: { categoryId: canonical.id },
                    });
                    for (const svc of sub.services) {
                        await prisma.service.update({
                            where: { id: svc.id },
                            data: { categoryId: canonical.id },
                        });
                        movedServices++;
                    }
                    canonicalSubs.set(norm(sub.name), sub);
                    movedSubs++;
                }
            }
            await prisma.category.delete({ where: { id: dupe.id } });
            mergedCats++;
        }
    }

    // Bonus: fix the malformed "audit-servicesaudit-services" slug if present & unique
    const broken = await prisma.category.findFirst({ where: { slug: 'audit-servicesaudit-services' } });
    if (broken) {
        const clash = await prisma.category.findFirst({ where: { slug: 'audit-services' } });
        if (!clash) {
            await prisma.category.update({ where: { id: broken.id }, data: { slug: 'audit-services' } });
            console.log('\nFixed slug: audit-servicesaudit-services → audit-services');
        }
    }

    console.log(`\nDone. Deleted ${mergedCats} duplicate categories, moved ${movedSubs} sub-categories, ${movedServices} services, removed ${deletedSubs} duplicate sub-categories.`);

    // Show final state
    const final = await prisma.category.findMany({ select: { slug: true, name: true } });
    console.log('\nFinal categories:');
    final.forEach(c => console.log(`  ${c.name} (${c.slug})`));

    await prisma.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
