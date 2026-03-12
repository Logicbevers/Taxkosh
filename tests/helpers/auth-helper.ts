import { Page, expect } from '@playwright/test';

export async function loginAs(page: Page, email: string) {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('#login-email', email);
    await page.fill('#login-password', 'Password123!');
    await page.click('#login-submit-btn');
    // Wait for the dashboard or admin dashboard
    await expect(page).toHaveURL(/\/dashboard/);
}
