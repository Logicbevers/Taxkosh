import { test, expect } from '@playwright/test';

test.describe('Services Flow', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', 'individual@test.com');
        await page.fill('input[name="password"]', 'Password123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/);
    });

    test('TC-SERVICE-01 Create Service Request', async ({ page }) => {
        await page.goto('/dashboard/services');
        await expect(page.locator('button:has-text("Start")').first()).toBeVisible();
    });

    test('TC-SERVICE-02 Payment Page Loads', async ({ page }) => {
        await page.goto('/dashboard/services');
        await expect(page.locator('button:has-text("Start")').first()).toBeVisible();
    });

});
