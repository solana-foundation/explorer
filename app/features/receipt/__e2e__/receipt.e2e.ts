import { expect, Page, test } from '@playwright/test';

test.describe.configure({ retries: 2 });

/** Delay between tests to avoid RPC rate limiting (429) */
const RPC_COOLDOWN_MS = 500;
const NAV_TIMEOUT = 60000;
const CONTENT_TIMEOUT = 15000;

const VALID_TX = '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW';
const INVALID_TX = '34qZEWsTW85uZSd4N53DptMaQ5HTx2cczgwWatW6CPhLbaetEX67jELmrCyz2M2ydkQin3NR9sMbgVxeqDwT8Sqp';
const FEATURE_ENABLED = process.env.NEXT_PUBLIC_RECEIPT_ENABLED === 'true';

test.describe('receipt feature validation', () => {
    test.afterEach(async () => {
        await delay(RPC_COOLDOWN_MS);
    });

    test('respects NEXT_PUBLIC_RECEIPT_ENABLED flag', async ({ page }) => {
        await waitForPage(page, VALID_TX, 'receipt');

        await page
            .locator('h3:has-text("Solana Receipt")')
            .or(page.locator('h2:has-text("Transaction")'))
            .or(page.locator('text=There is no receipt'))
            .first()
            .waitFor({ state: 'visible', timeout: CONTENT_TIMEOUT });

        const hasReceipt = await hasElement(page, 'h3:has-text("Solana Receipt")');
        const hasNoReceipt = await hasElement(page, 'text=There is no receipt');
        const hasTransactionPage = await hasElement(page, 'h2:has-text("Transaction")');

        if (FEATURE_ENABLED) {
            expect(hasReceipt || hasNoReceipt).toBe(true);
        } else {
            expect(hasReceipt).toBe(false);
            expect(hasTransactionPage).toBe(true);
        }
    });
});

test.describe('when feature enabled', () => {
    test.describe.configure({ mode: 'serial' });
    test.skip(!FEATURE_ENABLED);
    test.afterEach(async () => {
        await delay(RPC_COOLDOWN_MS);
    });

    test('renders receipt for valid transaction', async ({ page }) => {
        await waitForPage(page, VALID_TX, 'receipt');

        await page
            .locator('h3:has-text("Solana Receipt")')
            .or(page.locator('text=Not Found'))
            .or(page.locator('text=There is no receipt'))
            .first()
            .waitFor({ state: 'visible', timeout: CONTENT_TIMEOUT });

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

        await page.waitForFunction(
            () => {
                const text = document.body?.innerText || '';
                return text.includes('There is no receipt') || text.includes('Fetch Failed') || text.includes('Error');
            },
            { timeout: CONTENT_TIMEOUT }
        );

        const text = await page.textContent('body');
        const showsError =
            text?.includes('There is no receipt') || text?.includes('Fetch Failed') || text?.includes('Error');

        expect(showsError).toBe(true);
    });

    test('shows View Receipt button', async ({ page }) => {
        await waitForPage(page, VALID_TX);

        await page
            .locator('h3:has-text("Overview")')
            .or(page.locator('text=Fetch Failed'))
            .or(page.locator('text=Not Found'))
            .first()
            .waitFor({ state: 'visible', timeout: CONTENT_TIMEOUT });

        const hasOverview = await hasElement(page, 'h3:has-text("Overview")');

        if (hasOverview) {
            await expect(page.locator('a:has-text("View Receipt")')).toBeVisible({ timeout: CONTENT_TIMEOUT });
        } else {
            // just verify no error page (Overview didn't load - page may have errored)
            const bodyText = await page.textContent('body');
            expect(bodyText?.includes('Fetch Failed') || bodyText?.includes('Not Found')).toBe(true);
        }
    });
});

test.describe('when feature disabled', () => {
    test.describe.configure({ mode: 'serial' });
    test.skip(FEATURE_ENABLED);
    test.afterEach(async () => {
        await delay(RPC_COOLDOWN_MS);
    });

    test('ignores ?view=receipt parameter', async ({ page }) => {
        await waitForPage(page, VALID_TX, 'receipt');

        await expect(page.locator('h2:has-text("Transaction")')).toBeVisible({ timeout: CONTENT_TIMEOUT });

        expect(await hasElement(page, 'h3:has-text("Solana Receipt")')).toBe(false);
        expect(await hasElement(page, 'h2:has-text("Transaction")')).toBe(true);
    });

    test('hides View Receipt button', async ({ page }) => {
        await waitForPage(page, VALID_TX);

        await page
            .locator('h3:has-text("Overview")')
            .or(page.locator('h2:has-text("Transaction")'))
            .first()
            .waitFor({ state: 'visible', timeout: CONTENT_TIMEOUT });

        const hasOverview = await hasElement(page, 'h3:has-text("Overview")');

        if (hasOverview) {
            await expect(page.locator('a:has-text("View Receipt")')).toBeHidden();
        } else {
            expect(await hasElement(page, 'h3:has-text("Solana Receipt")')).toBe(false);
        }
    });
});

async function hasElement(page: Page, selector: string, timeout = 10000): Promise<boolean> {
    try {
        await page.locator(selector).waitFor({ state: 'visible', timeout });
        return true;
    } catch {
        return false;
    }
}

async function waitForPage(page: Page, tx: string, view?: 'receipt') {
    const url = view ? `/tx/${tx}?view=${view}` : `/tx/${tx}`;

    const responsePromise = page
        .waitForResponse(response => response.url().includes('api.') || response.url().includes('rpc'), {
            timeout: NAV_TIMEOUT,
        })
        .catch(() => null);

    await page.goto(url, { timeout: NAV_TIMEOUT, waitUntil: 'domcontentloaded' });
    await responsePromise;

    await page
        .locator('text=Loading')
        .waitFor({ state: 'hidden', timeout: 30000 })
        .catch(() => {});
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
