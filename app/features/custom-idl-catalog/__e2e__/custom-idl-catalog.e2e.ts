import { expect, type Page, test } from '@playwright/test';

const PROGRAM_ADDRESS = 'devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH';
const DATABASE = { name: 'explorer:customIdl', store: 'records', version: 1 };
const IDL = {
    address: PROGRAM_ADDRESS,
    instructions: [
        { accounts: [], args: [], discriminator: [175, 175, 109, 31, 13, 152, 155, 237], name: 'initialize' },
    ],
    metadata: { name: 'amm_v3', spec: '0.1.0', version: '0.1.0' },
};
// A save selects the custom IDL, so a stored on-chain selection shows that no save ran.
const STORED_VALUE = JSON.stringify({ idl: IDL, origin: { kind: 'pasted' }, selected: 'onChain' });

test.describe('custom IDL catalog', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/tos?cluster=devnet');
        await page.evaluate(
            async ({ database, key, value }) => {
                const connection = await new Promise<IDBDatabase>((resolve, reject) => {
                    const request = indexedDB.open(database.name, database.version);
                    request.onupgradeneeded = () => request.result.createObjectStore(database.store);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
                const transaction = connection.transaction(database.store, 'readwrite');
                transaction.objectStore(database.store).put(value, key);
                await new Promise((resolve, reject) => {
                    transaction.oncomplete = resolve;
                    transaction.onabort = () => reject(transaction.error);
                });
                connection.close();
            },
            { database: DATABASE, key: PROGRAM_ADDRESS, value: STORED_VALUE },
        );
    });

    // jsdom does not run the submit that the browser runs for this click.
    test('should open the edit form on Edit and not save the IDL', async ({ page }) => {
        const catalog = await openCatalog(page);

        await catalog.getByRole('button', { exact: true, name: 'Edit' }).click();

        await expect(catalog.getByRole('button', { exact: true, name: 'Cancel' })).toBeVisible();
        expect(await storedValue(page)).toBe(STORED_VALUE);
    });

    test('should open a program from the drawer list and go back', async ({ page }) => {
        await page.setViewportSize({ height: 844, width: 390 });
        const catalog = await openCatalog(page);

        await catalog.getByText('Amm V3').click();
        await catalog.getByRole('button', { exact: true, name: 'Edit' }).click();
        await expect(catalog.getByRole('button', { exact: true, name: 'Cancel' })).toBeVisible();
        await catalog.getByRole('button', { exact: true, name: 'Cancel' }).click();
        await catalog.getByRole('button', { exact: true, name: 'Back' }).click();

        await expect(catalog.getByRole('navigation', { name: 'Programs with a custom IDL' })).toBeVisible();
        expect(await storedValue(page)).toBe(STORED_VALUE);
    });
});

async function openCatalog(page: Page) {
    await page.goto('/tos?cluster=devnet');
    // The dev server's indicator covers the bottom-left corner, where the drawer list sits on a phone.
    await page.evaluate(() => document.querySelector('nextjs-portal')?.remove());
    await page.getByRole('button', { exact: true, name: 'Custom IDLs' }).click();
    const catalog = page.getByRole('dialog');
    await expect(catalog.getByText('Amm V3').first()).toBeVisible();
    return catalog;
}

async function storedValue(page: Page): Promise<unknown> {
    return page.evaluate(
        async ({ database, key }) => {
            const connection = await new Promise<IDBDatabase>((resolve, reject) => {
                const request = indexedDB.open(database.name, database.version);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            const request = connection.transaction(database.store, 'readonly').objectStore(database.store).get(key);
            const value = await new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            connection.close();
            return value;
        },
        { database: DATABASE, key: PROGRAM_ADDRESS },
    );
}
