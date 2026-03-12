import { test, expect } from '@playwright/test';

test.describe('User Registration', () => {
    test.setTimeout(60000);

    test('TC-REG-01 Register as Individual', async ({ page }) => {
        await page.goto('/register');

        const uniqueEmail = `user_${Date.now()}@test.com`;

        await page.fill('input[name="name"]', 'Test Individual');
        await page.fill('input[name="email"]', uniqueEmail);

        // Role is INDIVIDUAL by default
        await page.fill('input[name="password"]', 'Password123!');
        await page.fill('input[name="confirmPassword"]', 'Password123!');

        await page.fill('input[name="pan"]', 'ABCDE1234F');
        await page.fill('input[name="aadhaarLast4"]', '1234');

        // Use more reliable selector for checkbox
        await page.locator('input#reg-terms').check();

        await page.click('button#register-submit-btn');

        // Should show check your inbox
        await expect(page.locator('text=Check your inbox')).toBeVisible({ timeout: 30000 });
    });

    test('TC-REG-02 Register as Business Owner', async ({ page }) => {
        await page.goto('/register');

        const uniqueEmail = `biz_${Date.now()}@test.com`;

        await page.fill('input[name="name"]', 'Test Business');
        await page.fill('input[name="email"]', uniqueEmail);

        // Select Business role
        await page.click('#reg-role');
        await page.click('text=Business Owner');

        // GSTIN field should appear
        await expect(page.locator('input[name="gstin"]')).toBeVisible();

        await page.fill('input[name="password"]', 'Password123!');
        await page.fill('input[name="confirmPassword"]', 'Password123!');

        await page.fill('input[name="pan"]', 'AAAAA0000A');
        // Valid GSTIN format (Regex in validation.ts)
        await page.fill('input[name="gstin"]', '27ABCDE1234A1Z5');

        await page.locator('input#reg-terms').check();

        await page.click('button#register-submit-btn');

        await expect(page.locator('text=Check your inbox')).toBeVisible({ timeout: 30000 });
    });

    test('TC-REG-03 Registration Validation Errors', async ({ page }) => {
        await page.goto('/register');

        await page.click('button#register-submit-btn');

        // Match exact strings from validations.ts
        await expect(page.locator('text=Name must be at least 2 characters')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
        await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
        await expect(page.locator('text=You must accept the terms')).toBeVisible();
    });
});
