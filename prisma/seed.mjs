/**
 * Production catalog seed — idempotent (upserts by slug), safe to re-run.
 *
 * Seeds BOTH models the app uses:
 *   - legacy Category → SubCategory → Service  (public site + checkout)
 *   - CatalogNode tree                          (admin console)
 *
 * Run:  npx prisma db seed        (or)  node prisma/seed.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Curated catalog — 4 categories, real services only, GST-inclusive prices. */
const CATALOG = [
    {
        name: "Income Tax", slug: "income-tax", description: "Income tax return filing and advisory.",
        subs: [
            {
                name: "ITR Filing", description: "Annual income tax return filing.",
                services: [
                    { name: "ITR-1 Salaried", slug: "itr-1-salaried", price: 2999, slaHours: 48,
                      description: "ITR-1 filing for salaried individuals with a single house property — prepared and filed by a CA.",
                      requiredDocuments: ["Form 16", "PAN Card", "Bank Statement", "Investment Proofs"] },
                    { name: "ITR-2 Capital Gains", slug: "itr-2-capital-gains", price: 4999, slaHours: 72,
                      description: "ITR-2 filing covering capital gains from stocks, mutual funds and property sale.",
                      requiredDocuments: ["Form 16", "Capital Gains Statement", "Form 26AS", "AIS/TIS"] },
                ],
            },
            {
                name: "Tax Planning", description: "Tax-saving strategies and advisory.",
                services: [
                    { name: "Annual Tax Advisory", slug: "annual-tax-advisory", price: 4999, slaHours: 168,
                      description: "Year-round tax planning and advisory with an ICAI-registered CA.",
                      requiredDocuments: ["Last 2 years ITR", "Income Statement"] },
                ],
            },
        ],
    },
    {
        name: "GST", slug: "gst", description: "Goods and Services Tax registration and returns.",
        subs: [
            {
                name: "GST Returns", description: "Monthly and quarterly GST return filing.",
                services: [
                    { name: "GSTR-1 + GSTR-3B Monthly", slug: "gstr-1-3b-monthly", price: 1499, slaHours: 72,
                      description: "Monthly GSTR-1 and GSTR-3B filing for small and medium businesses.",
                      requiredDocuments: ["Sales Register", "Purchase Register", "Invoices"] },
                ],
            },
            {
                name: "GST Registration", description: "New GST registration.",
                services: [
                    { name: "GST Registration Individual", slug: "gst-registration-individual", price: 1999, slaHours: 24,
                      description: "End-to-end GST registration for individuals and proprietors, including ARN tracking.",
                      requiredDocuments: ["PAN Card", "Aadhaar", "Rent Agreement", "Electricity Bill"] },
                ],
            },
        ],
    },
    {
        name: "TDS Compliance", slug: "tds", description: "TDS return filing and reconciliation.",
        subs: [
            {
                name: "TDS Returns", description: "Quarterly TDS return filing.",
                services: [
                    { name: "Form 24Q (Salary)", slug: "tds-form-24q", price: 4499, slaHours: 72,
                      description: "Quarterly Form 24Q TDS return for salary payments, with challan reconciliation.",
                      requiredDocuments: ["Salary Register", "TDS Challans", "Form 16 details"] },
                ],
            },
        ],
    },
    {
        name: "Audit Services", slug: "audit-services", description: "Statutory audit support for companies.",
        subs: [
            {
                name: "Corporate Audit", description: "Annual statutory audit.",
                services: [
                    { name: "Corporate Yearly Audit", slug: "corp-audit", price: 9999, slaHours: 48,
                      description: "Annual statutory audit support for private limited companies.",
                      requiredDocuments: ["PAN Card", "Financial Statements", "Bank Statements"] },
                ],
            },
        ],
    },
];

async function main() {
    let cats = 0, subs = 0, svcs = 0, nodes = 0;

    for (const [ci, cat] of CATALOG.entries()) {
        // legacy Category
        const category = await prisma.category.upsert({
            where: { slug: cat.slug },
            update: { name: cat.name, description: cat.description, status: "active", displayOrder: ci },
            create: { name: cat.name, slug: cat.slug, description: cat.description, status: "active", displayOrder: ci },
        });
        cats++;
        // CatalogNode (depth 0)
        const catNode = await prisma.catalogNode.upsert({
            where: { slug: cat.slug },
            update: { name: cat.name, description: cat.description, status: "active", depth: 0, isLeaf: false, displayOrder: ci },
            create: { name: cat.name, slug: cat.slug, description: cat.description, status: "active", depth: 0, isLeaf: false, displayOrder: ci },
        });
        nodes++;

        for (const [si, sub] of cat.subs.entries()) {
            // legacy SubCategory (no slug column — match on categoryId + name)
            const existingSub = await prisma.subCategory.findFirst({ where: { categoryId: category.id, name: sub.name } });
            const subCategory = existingSub
                ? await prisma.subCategory.update({ where: { id: existingSub.id }, data: { description: sub.description, status: "active" } })
                : await prisma.subCategory.create({ data: { categoryId: category.id, name: sub.name, description: sub.description, status: "active" } });
            subs++;
            // CatalogNode (depth 1)
            const subSlug = `${cat.slug}-${sub.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
            const subNode = await prisma.catalogNode.upsert({
                where: { slug: subSlug },
                update: { name: sub.name, description: sub.description, status: "active", depth: 1, isLeaf: false, parentId: catNode.id, displayOrder: si },
                create: { name: sub.name, slug: subSlug, description: sub.description, status: "active", depth: 1, isLeaf: false, parentId: catNode.id, displayOrder: si },
            });
            nodes++;

            for (const [svi, svc] of sub.services.entries()) {
                // legacy Service
                await prisma.service.upsert({
                    where: { slug: svc.slug },
                    update: { name: svc.name, description: svc.description, price: svc.price, slaHours: svc.slaHours, requiredDocuments: svc.requiredDocuments, status: "active", categoryId: category.id, subCategoryId: subCategory.id },
                    create: { name: svc.name, slug: svc.slug, description: svc.description, price: svc.price, slaHours: svc.slaHours, requiredDocuments: svc.requiredDocuments, status: "active", categoryId: category.id, subCategoryId: subCategory.id },
                });
                svcs++;
                // CatalogNode leaf (depth 2)
                await prisma.catalogNode.upsert({
                    where: { slug: svc.slug },
                    update: { name: svc.name, description: svc.description, price: svc.price, slaHours: svc.slaHours, requiredDocuments: svc.requiredDocuments, status: "active", depth: 2, isLeaf: true, parentId: subNode.id, displayOrder: svi },
                    create: { name: svc.name, slug: svc.slug, description: svc.description, price: svc.price, slaHours: svc.slaHours, requiredDocuments: svc.requiredDocuments, status: "active", depth: 2, isLeaf: true, parentId: subNode.id, displayOrder: svi },
                });
                nodes++;
            }
        }
    }

    console.log(`✅ Catalog seeded — categories:${cats} subcategories:${subs} services:${svcs} catalogNodes:${nodes}`);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
