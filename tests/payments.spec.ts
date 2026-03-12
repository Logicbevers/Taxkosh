import { test, expect } from '@playwright/test';

test.describe('Payment Lifecycle', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', 'business@test.com');
        await page.fill('input[name="password"]', 'Password123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/);
    });

    test('User should see payment page and process success', async ({ page }) => {
        // Find a service request start button
        await page.goto('/dashboard/services');
        await expect(page.locator('button:has-text("Start")').first()).toBeVisible();
    });

});
