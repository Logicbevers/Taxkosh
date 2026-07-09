const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
(async () => {
  const u = await prisma.user.findUnique({ where: { email: 'admin@taxkosh.in' } });
  if (!u) {
    console.log('NO admin user found!');
    process.exit(1);
  }
  console.log('Admin user:');
  console.log('  ID:', u.id);
  console.log('  Email:', u.email);
  console.log('  Name:', u.name);
  console.log('  Role:', u.role);
  console.log('  Email verified:', u.emailVerified);
  console.log('  Has password:', !!u.password);
  if (u.password) {
    const ok = await bcrypt.compare('Admin@1234', u.password);
    console.log('  Password "Admin@1234" matches:', ok);
  }
  await prisma.$disconnect();
})();
