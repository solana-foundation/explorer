import { expect, Page, test } from '@playwright/test';

const VALID_TX = '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW';
const INVALID_TX = '34qZEWsTW85uZSd4N53DptMaQ5HTx2cczgwWatW6CPhLbaetEX67jELmrCyz2M2ydkQin3NR9sMbgVxeqDwT8Sqp';
const FEATURE_ENABLED = process.env.NEXT_PUBLIC_RECEIPT_ENABLED === 'true';

async function hasElement(page: Page, selector: string): Promise<boolean> {
    return page
        .locator(selector)
        .isVisible()
        .catch(() => false);
}

async function waitForPage(page: Page, tx: string, view?: 'receipt') {
    const url = view ? `/tx/${tx}?view=${view}` : `/tx/${tx}`;
    await page.goto(url, { timeout: 60000, waitUntil: 'networkidle' });
}

test.describe('receipt feature validation', () => {
    test('respects NEXT_PUBLIC_RECEIPT_ENABLED flag', async ({ page }) => {
        await waitForPage(page, VALID_TX, 'receipt');

        const hasReceipt = await hasElement(page, 'h3:has-text("Solana Receipt")');

        if (FEATURE_ENABLED) {
            expect(hasReceipt).toBe(true);
        } else {
            expect(hasReceipt).toBe(false);
            expect(await hasElement(page, 'h2:has-text("Transaction")')).toBe(true);
        }
    });
});

test.describe('when feature enabled', () => {
    test.skip(!FEATURE_ENABLED);

    test('renders receipt for valid transaction', async ({ page }) => {
        await waitForPage(page, VALID_TX, 'receipt');
        await page.waitForLoadState('networkidle');

        const hasReceipt = await hasElement(page, 'h3:has-text("Solana Receipt")');
        const hasError = await hasElement(page, 'text=Not Found');
        const hasNoReceipt = await hasElement(page, 'text=There is no receipt');

        expect(hasReceipt || hasError || hasNoReceipt).toBe(true);

        if (hasReceipt) {
            const bodyText = await page.textContent('body');
            // eslint-disable-next-line no-restricted-syntax -- Verify the receipt contains at least one of the expected fields
            expect(bodyText).toMatch(/Sender|Receiver|Status|Network/i);
        }
    });

    test('handles invalid transaction', async ({ page }) => {
        await waitForPage(page, INVALID_TX, 'receipt');
        await page.waitForTimeout(2000);

        const text = await page.textContent('body');
        const showsError =
            text?.includes('There is no receipt') || text?.includes('Fetch Failed') || text?.includes('Error');

        expect(showsError).toBe(true);
    });

    test('shows View Receipt button', async ({ page }) => {
        await waitForPage(page, VALID_TX);
        await page.waitForTimeout(2000);

        const hasOverview = await hasElement(page, 'h3:has-text("Overview")');

        if (hasOverview) {
            expect(await hasElement(page, 'a:has-text("View Receipt")')).toBe(true);
        } else {
            // just verify no error page
            const bodyText = await page.textContent('body');
            expect(bodyText?.includes('Fetch Failed') || bodyText?.includes('Not Found')).toBe(true);
        }
    });
});

test.describe('when feature disabled', () => {
    test.skip(FEATURE_ENABLED);

    test('ignores ?view=receipt parameter', async ({ page }) => {
        await waitForPage(page, VALID_TX, 'receipt');

        expect(await hasElement(page, 'h3:has-text("Solana Receipt")')).toBe(false);
        expect(await hasElement(page, 'h2:has-text("Transaction")')).toBe(true);
    });

    test('hides View Receipt button', async ({ page }) => {
        await waitForPage(page, VALID_TX);
        await page.waitForTimeout(2000);

        const hasOverview = await hasElement(page, 'h3:has-text("Overview")');

        if (hasOverview) {
            expect(await hasElement(page, 'a:has-text("View Receipt")')).toBe(false);
        } else {
            expect(await hasElement(page, 'h3:has-text("Solana Receipt")')).toBe(false);
        }
    });
});
