import { test, expect } from '@playwright/test';

test.describe('Service Request Lifecycle', () => {
    test('Full Service Lifecycle Journey', async ({ browser }) => {
        const timestamp = Date.now();
        const userEmail = `user_life_${timestamp}@example.com`;
        const adminEmail = `admin_life_${timestamp}@example.com`;
        const execEmail = `exec_life_${timestamp}@example.com`;

        // 1. Setup Admin
        const adminContext = await browser.newContext();
        const adminPage = await adminContext.newPage();

        await adminPage.goto('http://localhost:3000/register');
        await adminPage.getByLabel('Full Name').fill('Admin User');
        await adminPage.getByLabel('Email').fill(adminEmail);
        await adminPage.getByLabel('Password', { exact: true }).fill('Admin123!');
        await adminPage.getByLabel('Confirm Password').fill('Admin123!');
        await adminPage.locator('input#reg-terms').check();
        await adminPage.click('#register-submit-btn');
        await expect(adminPage.locator('text=Check your inbox')).toBeVisible();

        // Verify and Promote BEFORE Login
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

        // 2. Setup Executive
        const execContext = await browser.newContext();
        const execPage = await execContext.newPage();

        await execPage.goto('http://localhost:3000/register');
        await execPage.getByLabel('Full Name').fill('Exec User');
        await execPage.getByLabel('Email').fill(execEmail);
        await execPage.getByLabel('Password', { exact: true }).fill('Exec123!');
        await execPage.getByLabel('Confirm Password').fill('Exec123!');
        await execPage.locator('input#reg-terms').check();
        await execPage.click('#register-submit-btn');
        await expect(execPage.locator('text=Check your inbox')).toBeVisible();

        // Verify and Promote BEFORE Login
        await execPage.evaluate(async (email) => {
            await fetch('/api/admin/debug/verify-email', {
                method: 'POST',
                body: JSON.stringify({ email }),
                headers: { 'Content-Type': 'application/json' }
            });
            await fetch('/api/admin/debug/set-role', {
                method: 'POST',
                body: JSON.stringify({ email, role: 'TAX_EXECUTIVE' }),
                headers: { 'Content-Type': 'application/json' }
            });
        }, execEmail);

        // Login Exec
        await execPage.goto('http://localhost:3000/login');
        await execPage.fill('#login-email', execEmail);
        await execPage.fill('#login-password', 'Exec123!');
        await execPage.click('#login-submit-btn');
        await execPage.waitForURL(/.*dashboard/);

        // 3. Setup User & Request Service
        const userContext = await browser.newContext();
        const userPage = await userContext.newPage();

        await userPage.goto('http://localhost:3000/register');
        await userPage.getByLabel('Full Name').fill('Lifecycle User');
        await userPage.getByLabel('Email').fill(userEmail);
        await userPage.getByLabel('Password', { exact: true }).fill('User123!');
        await userPage.getByLabel('Confirm Password').fill('User123!');
        await userPage.locator('input#reg-terms').check();
        await userPage.click('#register-submit-btn');
        await expect(userPage.locator('text=Check your inbox')).toBeVisible();

        await userPage.evaluate(async (email) => {
            await fetch('/api/admin/debug/verify-email', {
                method: 'POST',
                body: JSON.stringify({ email }),
                headers: { 'Content-Type': 'application/json' }
            });
        }, userEmail);

        // Login User
        await userPage.goto('http://localhost:3000/login');
        await userPage.fill('#login-email', userEmail);
        await userPage.fill('#login-password', 'User123!');
        await userPage.click('#login-submit-btn');
        await userPage.waitForURL(/.*dashboard/);

        // Create Service Request
        await userPage.goto('http://localhost:3000/dashboard/services');
        await userPage.click('text=Individual Income Tax');
        // Wait for sub-category or just click
        await userPage.click('text=ITR-1 (Salary/Pension)');
        await userPage.click('text=Continue to Payment');

        await userPage.waitForURL(/.*\/services\/[a-z0-9-]+/);
        const serviceRequestId = userPage.url().split('/').pop();

        // 4. Simulator Payment
        await userPage.evaluate(async (id) => {
            await fetch('/api/payments/razorpay/webhook', {
                method: 'POST',
                body: JSON.stringify({
                    event: 'payment.captured',
                    payload: {
                        payment: { entity: { notes: { serviceRequestId: id }, status: 'captured' } }
                    }
                }),
                headers: { 'Content-Type': 'application/json' }
            });
        }, serviceRequestId);

        await userPage.reload();
        await expect(userPage.locator('text=Action Required: Upload Docs')).toBeVisible();

        // 5. ADMIN: Assign to Executive
        await adminPage.goto('http://localhost:3000/dashboard/admin/services');

        await adminPage.evaluate(async ({ id, execEmail }) => {
            const users = await (await fetch('/api/admin/team')).json();
            const exec = users.find((u: any) => u.email === execEmail);

            await fetch(`/api/admin/services/${id}/assign`, {
                method: 'PATCH',
                body: JSON.stringify({ assignedToId: exec.id }),
                headers: { 'Content-Type': 'application/json' }
            });
        }, { id: serviceRequestId, execEmail });

        // 6. EXECUTIVE: Process Request
        await execPage.goto(`http://localhost:3000/dashboard/admin/services`);

        await execPage.evaluate(async (id) => {
            await fetch(`/api/admin/services/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'UNDER_REVIEW' }),
                headers: { 'Content-Type': 'application/json' }
            });
        }, serviceRequestId);

        // Mark as FILED
        await execPage.evaluate(async (id) => {
            await fetch(`/api/admin/services/${id}/file`, {
                method: 'POST',
                body: JSON.stringify({ notes: 'ITR Filed successfully' }),
                headers: { 'Content-Type': 'application/json' }
            });
        }, serviceRequestId);

        // 7. USER: Verify Completion
        await userPage.goto('http://localhost:3000/dashboard');
        await expect(userPage.locator('text=Success: Filed')).toBeVisible();

        await adminContext.close();
        await execContext.close();
        await userContext.close();
    });
});
