import { FullConfig } from '@playwright/test';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

async function globalSetup(config: FullConfig) {
    // Load .env explicitly
    const envPath = path.resolve(process.cwd(), '.env');
    const result = dotenv.config({ path: envPath });

    console.log('--- Global Setup: Environment Debug ---');
    console.log('Env Path:', envPath);
    console.log('Dotenv Load Result:', result.error ? 'Error: ' + result.error : 'Success');

    const dbUrl = process.env.DATABASE_URL || '';
    console.log('Raw DATABASE_URL from ENV:', dbUrl);

    const prisma = new PrismaClient();

    try {
        // Clear existing test data
        if (!dbUrl.includes('test') && !dbUrl.includes('localhost')) {
            console.warn('WARNING: Global setup might be running on a non-local/test database. Proceed with CAUTION.');
            // process.exit(1); 
        }

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
                category: 'ITR_FILING',
                status: 'PENDING_DOCUMENTS',
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
        console.error('Global setup failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

export default globalSetup;
