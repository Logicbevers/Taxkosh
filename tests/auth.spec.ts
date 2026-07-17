import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
    test.setTimeout(60000);

    test('TC-AUTH-01 Successful Login', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', 'individual@test.com');
        await page.fill('input[name="password"]', 'Password123!');
        await page.click('button[type="submit"]');
        // Sign-in lands on the browsable home page, not /dashboard — deliberate, see
        // login-form.tsx ("callbackUrl ?? '/'"). Deep links still win via ?callbackUrl.
        await expect(page).toHaveURL(/localhost:3000\/$/, { timeout: 20000 });
        // The URL alone proves nothing about auth; the signed-in nav does.
        await expect(page.getByRole('link', { name: /dashboard/i }).first())
            .toBeVisible({ timeout: 20000 });
    });

    test('TC-AUTH-02 Invalid Login', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', 'wrong@test.com');
        await page.fill('input[name="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');
        // Match a shorter substring to be bulletproof
        await expect(page.locator('text=Invalid email or password').first()).toBeVisible({ timeout: 20000 });
    });

    test('TC-AUTH-03 Empty Login Fields', async ({ page }) => {
        await page.goto('/login');
        await page.click('button[type="submit"]');
        // Zod validation messages
        await expect(page.locator('text=valid email address')).toBeVisible({ timeout: 20000 });
        await expect(page.locator('text=Password is required')).toBeVisible({ timeout: 20000 });
    });

});
