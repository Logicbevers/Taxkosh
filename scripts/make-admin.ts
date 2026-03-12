import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function makeAdmin(email: string) {
    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: UserRole.ADMIN }
        });
        console.log(`Success! ${user.email} is now an ${user.role}.`);
    } catch (e) {
        console.error("User not found or database error.");
    } finally {
        await prisma.$disconnect();
    }
}

// Usage: npx ts-node scripts/make-admin.ts user@example.com
const email = process.argv[2];
if (!email) {
    console.log("Usage: npx ts-node scripts/make-admin.ts user@example.com");
} else {
    makeAdmin(email);
}
