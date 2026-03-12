import { test, expect } from '@playwright/test';

test('TC-SEC-01 XSS Input Blocked', async ({ page }) => {

    await page.goto('/login');

    // Disable browser validation to test Zod
    await page.$eval('form', form => (form as HTMLFormElement).noValidate = true);

    await page.fill('input[name="email"]', '<script>alert(1)</script>');
    await page.fill('input[name="password"]', 'test');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=valid email address')).toBeVisible();

});
