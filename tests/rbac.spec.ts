import { test, expect } from '@playwright/test';

test('TC-RBAC-01 Individual cannot access admin dashboard', async ({ page }) => {

    await page.goto('/login');

    await page.fill('input[name="email"]', 'individual@test.com');
    await page.fill('input[name="password"]', 'Password123!');

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    await page.goto('/dashboard/admin');

    // Should be redirected to /unauthorized
    await expect(page).toHaveURL(/\/unauthorized/);
    await expect(page.locator('h1')).toContainText('Access Denied');

});
