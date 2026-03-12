import { test, expect } from '@playwright/test';

test.describe('TDS Management', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', 'business@test.com');
        await page.fill('input[name="password"]', 'Password123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/);
    });

    test('User should be able to manage deductees and quarterly returns', async ({ page }) => {
        // 1. Manage Deductees
        await page.goto('/dashboard/business/tds/deductees');
        await page.click('button:has-text("Add Deductee")');

        // Wait for dialog
        await expect(page.locator('text=Add New Deductee')).toBeVisible();

        await page.fill('input[placeholder="e.g. John Doe"]', 'Test Vendor');
        await page.fill('input[placeholder="ABCDE1234F"]', 'ABCDE1234F');
        await page.click('button:has-text("Create Deductee")');

        await expect(page.locator('text=Test Vendor').first()).toBeVisible({ timeout: 10000 });

        // 2. Manage Quarterly Returns
        await page.goto('/dashboard/business/tds');
        await expect(page.locator('button:has-text("New TDS Return")').first()).toBeVisible();
    });

});
