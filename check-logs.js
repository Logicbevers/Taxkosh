const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- AUDIT LOG SCAN ---');
    const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { user: true }
    });
    if (logs.length === 0) {
        console.log('No audit logs found.');
    } else {
        logs.forEach(l => {
            console.log(`[${l.createdAt.toISOString()}] ${l.user?.email || 'SYSTEM'} - ${l.action} - ${JSON.stringify(l.details)}`);
        });
    }

    const users = await prisma.user.count();
    console.log(`Total users in DB: ${users}`);

    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
