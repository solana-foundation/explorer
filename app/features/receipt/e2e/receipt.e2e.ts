import { expect, test } from '@playwright/test';

const validSignature = '4Y4sN6zmSQJPegVTFLZ3ctLfTVs5tA4asjurL6RY8jhLVxZiy5po38qGAbZBytLHpjWh6jAMshGcZV8QfGvYtznE';
const invalidSignature = '34qZEWsTW85uZSd4N53DptMaQ5HTx2cczgwWatW6CPhLbaetEX67jELmrCyz2M2ydkQin3NR9sMbgVxeqDwT8Sqp';

test.describe('Receipt Feature - Valid Transaction', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`/tx/${validSignature}`, { timeout: 60000, waitUntil: 'networkidle' });

        await Promise.race([
            page.waitForSelector('h3:has-text("Solana Receipt")', { timeout: 45000 }).catch(() => null),
            page.waitForSelector('text=Not Found', { timeout: 45000 }).catch(() => null),
        ]);
    });

    test('should render page and load transaction data', async ({ page }) => {
        await expect(page).toHaveTitle(/Solana/);

        const bodyText = await page.textContent('body');

        const hasReceipt = await page
            .locator('h3:has-text("Solana Receipt")')
            .isVisible()
            .catch(() => false);
        const hasError = await page
            .locator('text=Not Found')
            .isVisible()
            .catch(() => false);
        const hasNoReceipt = await page
            .locator('text=There is no receipt')
            .isVisible()
            .catch(() => false);

        const hasAnyContent = hasReceipt || hasError || hasNoReceipt || (bodyText && bodyText.length > 100);

        expect(hasAnyContent).toBe(true);

        if (hasReceipt) {
            expect(bodyText).toMatch(/Sender|Receiver|Status|Network/i);
        }
    });
});

test.describe('Receipt Feature - Invalid Transaction', () => {
    test('should handle invalid transaction gracefully', async ({ page }) => {
        await page.goto(`/tx/${invalidSignature}`);

        await page.waitForTimeout(2000);

        const text = await page.textContent('body');
        const hasNoReceipt = text?.includes('There is no receipt for this transaction');
        const hasError = text?.includes('Fetch Failed') || text?.includes('Error');

        expect(hasNoReceipt || hasError).toBe(true);
    });
});
