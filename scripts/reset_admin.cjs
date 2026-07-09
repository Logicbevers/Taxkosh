const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
(async () => {
  const pw = await bcrypt.hash('Admin@1234', 12);
  await prisma.user.upsert({
    where: { email: 'admin@taxkosh.in' },
    update: { password: pw, emailVerified: new Date(), role: 'ADMIN', name: 'Admin' },
    create: { email: 'admin@taxkosh.in', name: 'Admin', password: pw, role: 'ADMIN', emailVerified: new Date() }
  });
  console.log('Admin reset. Login at http://localhost:3000/login');
  console.log('  Email:    admin@taxkosh.in');
  console.log('  Password: Admin@1234');
  await prisma.$disconnect();
})();
