import { test, expect } from '@playwright/test';

test.describe('Audit Logging Verification', () => {

    test('Audit Log Lifecycle', async ({ browser }) => {
        const timestamp = Date.now() + Math.floor(Math.random() * 1000);
        const userEmail = `user_audit_${timestamp}@example.com`;
        const adminEmail = `admin_audit_${timestamp}@example.com`;

        const adminContext = await browser.newContext();
        const adminPage = await adminContext.newPage();

        // 1. Register/Verify/Promote Admin
        await adminPage.goto('http://localhost:3000/register');
        await adminPage.getByLabel('Full Name').fill('Admin Audit');
        await adminPage.getByLabel('Email').fill(adminEmail);
        await adminPage.getByLabel('Password', { exact: true }).fill('Admin123!');
        await adminPage.getByLabel('Confirm Password').fill('Admin123!');
        await adminPage.locator('input#reg-terms').check();
        await adminPage.click('#register-submit-btn');
        await expect(adminPage.locator('text=Check your inbox')).toBeVisible();

        await adminPage.evaluate(async (email) => {
            await fetch('/api/admin/debug/verify-email', {
                method: 'POST',
                body: JSON.stringify({ email }),
                headers: { 'Content-Type': 'application/json' }
            });
            await fetch('/api/admin/debug/set-role', {
                method: 'POST',
                body: JSON.stringify({ email, role: 'ADMIN' }),
                headers: { 'Content-Type': 'application/json' }
            });
        }, adminEmail);

        // Login Admin
        await adminPage.goto('http://localhost:3000/login');
        await adminPage.fill('#login-email', adminEmail);
        await adminPage.fill('#login-password', 'Admin123!');
        await adminPage.click('#login-submit-btn');
        await adminPage.waitForURL(/.*dashboard/);

        // 2. USER Journey
        const userContext = await browser.newContext();
        const userPage = await userContext.newPage();

        await userPage.goto('http://localhost:3000/register');
        await userPage.getByLabel('Full Name').fill('Audit User');
        await userPage.getByLabel('Email').fill(userEmail);
        await userPage.getByLabel('Password', { exact: true }).fill('User123!');
        await userPage.getByLabel('Confirm Password').fill('User123!');
        await userPage.locator('input#reg-terms').check();
        await userPage.click('#register-submit-btn');
        await expect(userPage.locator('text=Check your inbox')).toBeVisible();

        // Verify & Seed Data
        const seedData = await userPage.evaluate(async (email) => {
            const vRes = await fetch('/api/admin/debug/verify-email', {
                method: 'POST',
                body: JSON.stringify({ email }),
                headers: { 'Content-Type': 'application/json' }
            });
            console.log('User verification status:', vRes.status);

            const sRes = await fetch('/api/admin/debug/seed-audit-data', {
                method: 'POST',
                body: JSON.stringify({ email }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await sRes.json();
            console.log('Seeding data:', data);
            return data;
        }, userEmail);

        // Login User
        await userPage.goto('http://localhost:3000/login');
        await userPage.fill('#login-email', userEmail);
        await userPage.fill('#login-password', 'User123!');
        await userPage.click('#login-submit-btn');
        await userPage.waitForURL(/.*dashboard/);

        // Action B: View a Document (Trigger Log)
        console.log('Triggering DOCUMENT_VIEW for id:', seedData.docId);
        await userPage.evaluate(async (id) => {
            const vRes = await fetch(`/api/documents/${id}/view`);
            console.log('View API status:', vRes.status);
        }, seedData.docId);

        // Action C: Submit ITR (Trigger Log)
        console.log('Triggering ITR_SUBMISSION');
        await userPage.evaluate(async () => {
            const sRes = await fetch('/api/itr/submit', { method: 'POST' });
            console.log('ITR Submission API status:', sRes.status);
        });

        // 3. ADMIN: Verify Logs
        await adminPage.reload();
        await adminPage.goto('http://localhost:3000/dashboard/admin/audit-logs');

        // Wait for entries to appear (might need many retries or just checking API)
        await expect(adminPage.locator(`text=${userEmail}`).first()).toBeVisible();

        const logs = await adminPage.evaluate(async () => {
            const res = await fetch('/api/admin/audit-logs');
            return await res.json();
        });

        const userLogs = logs.filter((l: any) => l.user?.email === userEmail);
        const actions = userLogs.map((l: any) => l.action).filter((a: string, i: number, arr: string[]) => arr.indexOf(a) === i); // Unique

        console.log('Detected Actions:', actions);
        expect(actions).toContain('LOGIN');
        expect(actions).toContain('DOCUMENT_VIEW');
        expect(actions).toContain('ITR_SUBMISSION');

        await adminContext.close();
        await userContext.close();
    });
});
