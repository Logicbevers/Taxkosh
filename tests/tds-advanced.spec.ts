import { test, expect } from '@playwright/test';

/**
 * TDS Advanced Module Tests
 * Covers Deductee Management, Return Creation, and Challan Linking.
 */
test.describe('TDS Module - Business Workflow', () => {
    let businessEmail: string;

    test.beforeEach(async ({ page }) => {
        const businessEmail = `biz_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`;

        // 1. Register
        await page.goto('http://localhost:3000/register');
        await page.getByLabel('Full Name').fill('TDS Test Business');
        await page.getByLabel('Email').fill(businessEmail);

        await page.click('#reg-role');
        await page.getByRole('option', { name: 'Business Owner' }).click();

        await page.getByLabel('Password', { exact: true }).fill('Password123!');
        await page.getByLabel('Confirm Password').fill('Password123!');
        await page.getByLabel('PAN Number').fill('ABCDE1234F');
        await page.getByLabel('GSTIN').fill('27ABCDE1234F1Z5');

        await page.locator('input#reg-terms').check();
        await page.click('#register-submit-btn');

        // Wait for success screen
        await expect(page.locator('text=Check your inbox')).toBeVisible();

        // 2. Verify Email via Debug API
        await page.evaluate(async (email) => {
            await fetch('/api/admin/debug/verify-email', {
                method: 'POST',
                body: JSON.stringify({ email }),
                headers: { 'Content-Type': 'application/json' }
            });
        }, businessEmail);

        // 3. Login
        await page.goto('http://localhost:3000/login');
        await page.fill('#login-email', businessEmail);
        await page.fill('#login-password', 'Password123!');
        await page.click('#login-submit-btn');

        // Wait for dashboard
        await expect(page).toHaveURL(/.*dashboard(\/business)?/, { timeout: 15000 });

        // Log any API failures to debug tests
        page.on('response', async (res) => {
            if (!res.ok() && res.url().includes('/api/')) {
                console.error(`API Error on ${res.url()}: ${res.status()}`);
                try {
                    console.error("Response body:", await res.json());
                } catch (e) {
                    console.error("Could not parse error response body");
                }
            }
        });
    });

    test('TC-TDS-01: Create Deductee', async ({ page }) => {
        await page.goto('http://localhost:3000/dashboard/business/tds/deductees');

        // Click Add Deductee
        await page.click('button:has-text("Add Deductee")');

        // Fill Deductee Form
        await page.fill('input[placeholder="e.g. John Doe"]', 'Test Vendor');
        await page.fill('input[placeholder="ABCDE1234F"]', 'PQRSH7788K');

        // Select Category: Non-Company
        // Open Select
        await page.click('button:has(span:text("Non-Company / Individual"))');
        // Select Option
        await page.click('div[role="option"]:has-text("Non-Company / Individual")');

        await page.click('button:has-text("Create Deductee")');

        // Verify appearance in table
        await expect(page.locator('table')).toContainText('Test Vendor');
        await expect(page.locator('table')).toContainText('NON_COMPANY');
    });

    test('TC-TDS-02: Create TDS Return Draft & Add Entry', async ({ page }) => {
        // First ensure we have a deductee to select
        await page.goto('http://localhost:3000/dashboard/business/tds/deductees');
        await page.click('button:has-text("Add Deductee")');
        await page.fill('input[placeholder="e.g. John Doe"]', 'Vendor for Return');
        await page.fill('input[placeholder="ABCDE1234F"]', 'JKLMN1122M');
        await page.click('button:has-text("Create Deductee")');

        // Create a return via API if UI button is not yet linked (safe fallback for testing)
        const returnId = await page.evaluate(async () => {
            const res = await fetch('/api/tds/returns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ financialYear: '2024-25', quarter: 4, formType: 'FORM_26Q' })
            });
            const data = await res.json();
            if (!res.ok) {
                console.error("Failed to create return:", data);
                throw new Error(`Failed to create return: ${data.error}`);
            }
            return data.id;
        });

        await page.goto(`http://localhost:3000/dashboard/business/tds/returns/${returnId}`);

        // Add Entry
        await page.click('button:has-text("Add Entry")');

        // Select Deductee
        await page.click('button:has-text("Search vendor/employee")');
        await page.click('div[role="option"] >> nth=0');

        // Section Code 194C
        await page.click('button:has(span:text("194C"))');
        await page.click('div[role="option"]:has-text("Contractors (194C)")');

        await page.fill('input[name="dateOfPayment"]', '2025-03-01');
        await page.fill('input[name="amountPaid"]', '50000');
        await page.fill('input[name="tdsRate"]', '1');

        await page.click('button:has-text("Save Entry")');

        // Verify entry in table
        await expect(page.locator('table >> nth=0')).toContainText('₹50,000');
        await expect(page.locator('table >> nth=0')).toContainText('194C');
    });

    test('TC-TDS-03: Challan Mapping', async ({ page }) => {
        // Setup a return draft
        const returnId = await page.evaluate(async () => {
            const res = await fetch('/api/tds/returns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ financialYear: '2024-25', quarter: 4, formType: 'FORM_26Q' })
            });
            const data = await res.json();
            if (!res.ok) {
                console.error("Failed to create return:", data);
                throw new Error(`Failed to create return: ${data.error}`);
            }
            return data.id;
        });

        await page.goto(`http://localhost:3000/dashboard/business/tds/returns/${returnId}`);

        // Add Challan
        await page.click('button:has-text("Add Challan")');

        await page.fill('input[name="bsrCode"]', '1234567');
        await page.fill('input[name="challanSerial"]', '98765');
        await page.fill('input[name="dateOfDeposit"]', '2025-03-07');
        await page.fill('input[name="amount"]', '500');

        await page.click('button:has-text("Link Challan")');

        // Verify appearance in Challan table
        await expect(page.locator('table >> nth=1')).toContainText('1234567');
        await expect(page.locator('table >> nth=1')).toContainText('₹500');
    });
});
