import { test, expect } from '@playwright/test';

test.describe('ITR Builder Flow', () => {
    test.setTimeout(60000);

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', 'individual@test.com');
        await page.fill('input[name="password"]', 'Password123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/);
    });

    test('TC-ITR-01 Personal Information Step', async ({ page }) => {
        await page.goto('/dashboard/individual');
        await page.click('text=File ITR for FY 2024-25');
        await expect(page.locator('text=Personal Information')).toBeVisible();
        await expect(page.locator('button:has-text("Continue to Income")')).toBeVisible();
    });

    test('TC-ITR-02 Full Journey to Computation', async ({ page }) => {
        await page.goto('/dashboard/individual/itr-filing');

        // Step 1: Personal (Pre-filled mostly, just click)
        await expect(page.locator('text=Personal Information')).toBeVisible();
        await page.click('text=Continue to Income');

        // Step 2: Income
        await expect(page.locator('text=Income Sources')).toBeVisible();
        await page.fill('input[name="income.salary"]', '1200000');
        await page.click('text=Continue to Deductions');

        // Step 3: Deductions
        await expect(page.locator('text=Tax Deductions')).toBeVisible();
        await page.fill('input[name="deductions.section80C"]', '150000');
        await page.click('text=Compute Tax Liability');

        // Step 4: Computation
        await expect(page.locator('h2:has-text("Tax Computation")')).toBeVisible({ timeout: 20000 });
        await expect(page.locator('text=Net Tax Liability').first()).toBeVisible();
    });

});
