import { test, expect } from '@playwright/test';

test('TC-DOC-01 Upload Document', async ({ page }) => {

    await page.goto('/login');

    await page.fill('input[name="email"]', 'business@test.com');
    await page.fill('input[name="password"]', 'Password123!');

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // Using the seeded test service id
    await page.goto('/dashboard/services/test-service-id');

    // Use setInputFiles to bypass the file chooser dialog
    await page.setInputFiles('input[type="file"]', 'tests/files/Form16.pdf');

    // After upload, the document should appear in the list. 
    // The uploader calls router.refresh() 
    await expect(page.locator('text=Form16.pdf')).toBeVisible({ timeout: 20000 });

});
