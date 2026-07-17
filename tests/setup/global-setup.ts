import { FullConfig } from '@playwright/test';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

async function globalSetup(_config: FullConfig) {
    // .env.test, never .env — this file runs deleteMany. Loading .env pointed the
    // suite at the working dev database, where it would have wiped real rows.
    const envPath = path.resolve(process.cwd(), '.env.test');
    const result = dotenv.config({ path: envPath, override: true });
    if (result.error) {
        throw new Error(`Cannot run e2e tests: ${envPath} is missing or unreadable.`);
    }

    const dbUrl = process.env.DATABASE_URL || '';

    // A hard stop, not a warning. The previous version logged a warning with the
    // exit commented out, so a misconfigured DATABASE_URL would silently destroy
    // data instead of failing. Never soften this back into a console.warn.
    const dbName = dbUrl.split('/').pop()?.split('?')[0] ?? '';
    if (!/test/i.test(dbName)) {
        throw new Error(
            `Refusing to run e2e tests against database "${dbName}" — its name must contain "test".\n` +
            `This suite deletes and rewrites rows. Point DATABASE_URL in .env.test at a throwaway database.`
        );
    }

    console.log(`--- Global Setup: seeding "${dbName}" ---`);
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

    try {
        await prisma.user.deleteMany({ where: { email: { contains: '@test.com' } } });

        const hashedPassword = await bcrypt.hash('Password123!', 12);

        // Create Admin
        await prisma.user.upsert({
            where: { email: 'admin@test.com' },
            update: { password: hashedPassword },
            create: {
                email: 'admin@test.com',
                name: 'Test Admin',
                password: hashedPassword,
                role: UserRole.ADMIN,
                emailVerified: new Date(),
            },
        });

        // Create Individual
        const individualUser = await prisma.user.upsert({
            where: { email: 'individual@test.com' },
            update: { password: hashedPassword },
            create: {
                email: 'individual@test.com',
                name: 'Test Individual',
                password: hashedPassword,
                role: UserRole.INDIVIDUAL,
                emailVerified: new Date(),
                pan: 'ABCDE1234F',
            },
        });

        // Create Business
        const businessUser = await prisma.user.upsert({
            where: { email: 'business@test.com' },
            update: { password: hashedPassword },
            create: {
                email: 'business@test.com',
                name: 'Test Business',
                password: hashedPassword,
                role: UserRole.BUSINESS,
                emailVerified: new Date(),
                pan: 'BCDEF2345G',
            },
        });

        // Create CA
        await prisma.user.upsert({
            where: { email: 'ca@test.com' },
            update: { password: hashedPassword },
            create: {
                email: 'ca@test.com',
                name: 'Test CA',
                password: hashedPassword,
                role: UserRole.CA,
                emailVerified: new Date(),
                pan: 'CDEFG3456H',
            },
        });

        // Seed a Service Request for document upload tests
        await prisma.serviceRequest.upsert({
            where: { id: 'test-service-id' },
            update: { userId: businessUser.id },
            create: {
                id: 'test-service-id',
                userId: businessUser.id,
                status: 'DOCUMENTS_PENDING',
                amount: 49900,
            }
        });

        // Seed a TDS Return for TDS tests
        await prisma.tdsReturn.upsert({
            where: { id: 'test-tds-return-id' },
            update: { userId: businessUser.id },
            create: {
                id: 'test-tds-return-id',
                userId: businessUser.id,
                financialYear: '2024-25',
                quarter: 1,
                formType: 'FORM_26Q',
                status: 'DRAFT'
            }
        });

        console.log('--- Global Setup: Done ---');
    } catch (error) {
        // Rethrow: swallowing this let the whole suite run against an unseeded
        // database, turning one setup failure into a wall of unrelated test failures.
        console.error('Global setup failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

export default globalSetup;
