import { test, expect } from '@playwright/test';

test.describe('ITR Advanced Features', () => {
    test.setTimeout(90000);

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', 'individual@test.com');
        await page.fill('input[name="password"]', 'Password123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/);
    });

    test('TC-ITR-04 Full Flow with Submission and Exports', async ({ page }) => {
        // Start from ITR dashboard
        await page.goto('/dashboard/individual/itr-filing');

        // Step 1: Personal (Pre-filled mostly)
        await page.click('text=Continue to Income');

        // Step 2: Income
        await page.fill('input[name="income.salary"]', '1500000');
        await page.click('text=Continue to Deductions');

        // Step 3: Deductions
        await page.fill('input[name="deductions.section80C"]', '150000');
        await page.click('text=Compute Tax Liability');

        // Step 4: Computation (Wait for summary)
        await expect(page.locator('text=Net Tax Liability').first()).toBeVisible({ timeout: 20000 });
        await page.click('text=Proceed to File & Export');

        // Step 5: Export & Submit
        await expect(page.locator('text=Computation Complete')).toBeVisible();

        // 1. Download PDF
        const pdfPromise = page.waitForEvent('download');
        await page.click('text=Generate PDF');
        const pdfDownload = await pdfPromise;
        expect(pdfDownload.suggestedFilename()).toContain('.pdf');

        // 2. Download JSON
        const jsonPromise = page.waitForEvent('download');
        await page.click('text=Download JSON');
        const jsonDownload = await jsonPromise;
        expect(jsonDownload.suggestedFilename()).toContain('.json');

        // 3. Submit ITR
        await page.click('button:has-text("Submit ITR")');
        await expect(page.locator('text=ITR Successfully Submitted!')).toBeVisible({ timeout: 30000 });
        await expect(page.locator('text=Acknowledgement Number:')).toBeVisible();
    });

    test('TC-ITR-05 Draft Persistence on Resume', async ({ page }) => {
        await page.goto('/dashboard/individual/itr-filing');

        // Fill something in Personal Step
        await page.fill('input[name="personal.pan"]', 'ABCDE1234F');
        await page.click('text=Continue to Income');

        // Fill salary then logout
        await page.fill('input[name="income.salary"]', '888888');

        // Manual wait for auto-save if any (though click triggers it)
        await page.waitForTimeout(1000);

        // Sign out
        await page.goto('/dashboard/individual');
        await page.click('button:has-text("Sign Out")');

        // Log back in
        await page.goto('/login');
        await page.fill('input[name="email"]', 'individual@test.com');
        await page.fill('input[name="password"]', 'Password123!');
        await page.click('button[type="submit"]');

        await page.goto('/dashboard/individual/itr-filing');

        // Verify it jumped to Deductions (since Income was filled) or at least check the value
        // The wizard jumps to DEDUCTIONS if incomeData exists
        await expect(page.locator('text=Tax Deductions')).toBeVisible({ timeout: 20000 });

        // Go back to Income and check value
        await page.click('text=Back');
        await expect(page.locator('input[name="income.salary"]')).toHaveValue('888888');
    });
});
