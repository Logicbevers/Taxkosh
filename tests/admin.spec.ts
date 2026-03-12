import { test, expect } from '@playwright/test';

test('TC-ADMIN-01 View Service Request', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Wait for login to complete
    await expect(page).toHaveURL(/.*dashboard/);

    await page.goto('/dashboard/admin/services');

    // Wait for the dynamic content to load (the table row with the seeded id)
    const serviceLink = page.locator('a[href*="/dashboard/admin/services/"]');
    await expect(serviceLink.first()).toBeVisible({ timeout: 15000 });

    // Click on the detail link
    await serviceLink.first().click();

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Management Actions')).toBeVisible();
});
