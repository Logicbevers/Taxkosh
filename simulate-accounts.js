const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function createSubagentUsers() {
    try {
        const passwordHash = await hash("password123", 10);

        await prisma.user.upsert({
            where: { email: "admin@taxkosh.in" },
            update: { password: passwordHash, role: "ADMIN", emailVerified: new Date() },
            create: { name: "Agent Admin", email: "admin@taxkosh.in", password: passwordHash, role: "ADMIN", emailVerified: new Date() }
        });

        await prisma.user.upsert({
            where: { email: "user@taxkosh.in" },
            update: { password: passwordHash, role: "INDIVIDUAL", emailVerified: new Date() },
            create: { name: "Agent User", email: "user@taxkosh.in", password: passwordHash, role: "INDIVIDUAL", emailVerified: new Date() }
        });

        console.log("Subagent test accounts successfully generated.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

createSubagentUsers();
