import { test, expect } from '@playwright/test';

test.describe('GST Invoicing & Returns', () => {
    test.setTimeout(60000);

    test.beforeEach(async ({ page }) => {
        // Login as business user
        await page.goto('/login');
        await page.fill('input[name="email"]', 'business@test.com');
        await page.fill('input[name="password"]', 'Password123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/);
    });

    test('TC-GST-01 Record Sales Invoice and Verify Math', async ({ page }) => {
        await page.goto('/dashboard/business/sales');

        await page.click('text=Record Sale');

        // Fill invoice details
        const invNum = `INV-${Date.now()}`;
        await page.fill('input[name="invoiceNumber"]', invNum);
        await page.fill('input[name="counterpartyName"]', 'Client Alpha');
        await page.fill('input[name="counterpartyGstin"]', '22AAAAA0000A1Z5');

        // Line Item 1
        await page.fill('input[name="items.0.description"]', 'Consulting Services');
        await page.fill('input[name="items.0.quantity"]', '10');
        await page.fill('input[name="items.0.rate"]', '1000');

        // GST Rates
        await page.fill('input[name="items.0.cgstRate"]', '9');
        await page.fill('input[name="items.0.sgstRate"]', '9');

        // Trigger recalculation (blur)
        await page.focus('input[name="items.0.rate"]');
        await page.keyboard.press('Tab');

        // Verify auto-calculated taxable value (10 * 1000 = 10000)
        const taxableVal = await page.inputValue('input[name="items.0.taxableValue"]');
        expect(taxableVal).toBe('10000');

        await page.click('text=Save Sale Invoice');

        // Verify it appears in the list
        await expect(page.locator(`text=${invNum}`)).toBeVisible({ timeout: 20000 });
        await expect(page.locator('text=Client Alpha')).toBeVisible();
    });

    test('TC-GST-02 Verify Business Profile Persistence', async ({ page }) => {
        await page.goto('/dashboard/business/profile');

        const legalName = `Test Corp ${Date.now()}`;
        const gstin = '22AAAAA0000A1Z5';

        await page.fill('input[name="legalName"]', legalName);
        await page.fill('input[name="gstin"]', gstin);

        await page.click('text=Save Business Profile');

        await expect(page.locator('text=Business profile updated successfully')).toBeVisible();

        // Refresh and verify
        await page.reload();
        await expect(page.locator('input[name="legalName"]')).toHaveValue(legalName);
        await expect(page.locator('input[name="gstin"]')).toHaveValue(gstin);
    });

    test('TC-GST-03 Export GSTR-1 JSON', async ({ page }) => {
        await page.goto('/dashboard/business/returns');

        // Ensure we have data or at least the button is testable
        // Note: Downloading files in Playwright needs handling
        const downloadPromise = page.waitForEvent('download');
        await page.click('text=Export GSTR-1 JSON Payload');
        const download = await downloadPromise;

        expect(download.suggestedFilename()).toContain('GSTR1_');
        expect(download.suggestedFilename()).toContain('.json');
    });
});
