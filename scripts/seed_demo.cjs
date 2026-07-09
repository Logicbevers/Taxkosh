// Seed a realistic 3-level catalog so admins/users can immediately interact
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const catalog = [
  {
    name: 'Income Tax',
    slug: 'income-tax',
    description: 'Personal and business income tax filing services',
    displayOrder: 1,
    subCategories: [
      {
        name: 'ITR Filing',
        description: 'Income Tax Return preparation and filing',
        services: [
          {
            name: 'ITR-1 Salaried',
            slug: 'itr-1-salaried',
            description: 'For salaried individuals with single house property income',
            requiredDocuments: ['Form 16', 'PAN Card', 'Bank Statement', 'Investment Proofs'],
            slaHours: 48,
            plans: [
              { planName: 'Basic', price: 999, turnaroundTime: '48 Hours', description: 'Standard filing with TDS reconciliation' },
              { planName: 'Premium', price: 2499, turnaroundTime: '24 Hours', description: 'Expert review + tax optimization advice + priority filing' },
            ]
          },
          {
            name: 'ITR-2 Capital Gains',
            slug: 'itr-2-capital-gains',
            description: 'For individuals with capital gains, multiple properties, or foreign assets',
            requiredDocuments: ['Form 16', 'Capital Gains Statement', 'Form 26AS', 'AIS/TIS'],
            slaHours: 72,
            plans: [
              { planName: 'Standard', price: 2999, turnaroundTime: '72 Hours', description: 'Capital gains computation and filing' },
              { planName: 'Premium', price: 4999, turnaroundTime: '48 Hours', description: 'Tax-loss harvesting analysis + expert consultation' },
            ]
          }
        ]
      },
      {
        name: 'Tax Planning',
        description: 'Tax-saving strategies and advisory',
        services: [
          {
            name: 'Annual Tax Advisory',
            slug: 'annual-tax-advisory',
            description: '1-on-1 session with a CA for personalized tax planning',
            requiredDocuments: ['Last 2 years ITR', 'Income Statement'],
            slaHours: 168,
            plans: [
              { planName: 'Single Session', price: 1499, turnaroundTime: '1 Week', description: '60-min consultation' },
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'GST',
    slug: 'gst',
    description: 'Goods and Services Tax compliance for businesses',
    displayOrder: 2,
    subCategories: [
      {
        name: 'GST Registration',
        description: 'New GST registration and amendments',
        services: [
          {
            name: 'New GST Registration',
            slug: 'gst-registration-new',
            description: 'Get GSTIN for your new business',
            requiredDocuments: ['PAN', 'Aadhaar', 'Business Proof', 'Bank Statement', 'Photo'],
            slaHours: 96,
            plans: [
              { planName: 'Basic', price: 1499, turnaroundTime: '4 Days', description: 'Application and tracking' },
              { planName: 'Express', price: 2999, turnaroundTime: '48 Hours', description: 'Priority handling with daily updates' },
            ]
          }
        ]
      },
      {
        name: 'GST Returns',
        description: 'Monthly and quarterly GST return filing',
        services: [
          {
            name: 'GSTR-1 + GSTR-3B Monthly',
            slug: 'gstr-1-3b-monthly',
            description: 'Monthly GST filing for small and medium businesses',
            requiredDocuments: ['Sales Register', 'Purchase Register', 'Invoices'],
            slaHours: 72,
            plans: [
              { planName: 'Single Month', price: 999, turnaroundTime: '3 Days', description: 'One month filing' },
              { planName: 'Quarterly Bundle', price: 2499, turnaroundTime: 'Each Month', description: '3 months bundled at discount' },
              { planName: 'Annual Bundle', price: 8999, turnaroundTime: 'Monthly', description: '12 months at maximum savings' },
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'TDS Compliance',
    slug: 'tds',
    description: 'Tax Deducted at Source filings and certificates',
    displayOrder: 3,
    subCategories: [
      {
        name: 'TDS Returns',
        description: 'Quarterly TDS return filing',
        services: [
          {
            name: 'Form 24Q (Salary)',
            slug: 'tds-form-24q',
            description: 'Quarterly TDS return for salary payments',
            requiredDocuments: ['Salary Register', 'TDS Challans', 'Form 16 details'],
            slaHours: 72,
            plans: [
              { planName: 'Up to 50 employees', price: 1999, turnaroundTime: '3 Days', description: 'Standard filing' },
              { planName: 'Up to 200 employees', price: 3999, turnaroundTime: '3 Days', description: 'Bulk filing' },
            ]
          }
        ]
      }
    ]
  }
];

(async () => {
  console.log('Seeding 3-level service catalog...\n');
  let catsCreated = 0, subsCreated = 0, svcsCreated = 0, plansCreated = 0;

  for (const c of catalog) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        displayOrder: c.displayOrder,
        status: 'active'
      }
    });
    catsCreated++;
    console.log('  [L1] ' + cat.name);

    for (const s of c.subCategories) {
      let sub = await prisma.subCategory.findFirst({ where: { categoryId: cat.id, name: s.name } });
      if (!sub) {
        sub = await prisma.subCategory.create({
          data: { name: s.name, description: s.description, categoryId: cat.id, status: 'active' }
        });
        subsCreated++;
      }
      console.log('    [L2] ' + sub.name);

      for (const sv of s.services) {
        let svc = await prisma.service.findUnique({ where: { slug: sv.slug } });
        if (!svc) {
          svc = await prisma.service.create({
            data: {
              name: sv.name,
              slug: sv.slug,
              categoryId: cat.id,
              subCategoryId: sub.id,
              description: sv.description,
              requiredDocuments: sv.requiredDocuments,
              slaHours: sv.slaHours,
              status: 'active'
            }
          });
          svcsCreated++;
        }
        console.log('      [L3] ' + svc.name);

        for (const p of sv.plans) {
          const exists = await prisma.servicePlan.findFirst({
            where: { serviceId: svc.id, planName: p.planName }
          });
          if (!exists) {
            await prisma.servicePlan.create({
              data: { ...p, serviceId: svc.id, status: 'active' }
            });
            plansCreated++;
          }
          console.log('        [Plan] ' + p.planName + ' — ₹' + p.price);
        }
      }
    }
  }

  console.log('\nSEEDED: ' + catsCreated + ' categories, ' + subsCreated + ' sub-categories, ' + svcsCreated + ' services, ' + plansCreated + ' plans');
  await prisma.$disconnect();
})().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
