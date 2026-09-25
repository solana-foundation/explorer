import { expect, Page, test } from '@playwright/test';

test.describe.configure({ retries: 2 });

/** Delay between tests to avoid RPC rate limiting (429) */
const RPC_COOLDOWN_MS = 500;
const CONTENT_TIMEOUT = 15000;

// Real signatures rather than the seeded `gen.*` fixtures the specs use: these tests exercise the live RPC
// path, so the signature has to genuinely exist on chain, or genuinely not.
const VALID_TX = '5ZPbKwtdQmTFq3BKCfBgGi9mr2VkbDnpJjntKsWqrHVaxvkb7nxjryTWyXKmbvmkv332PzQBrtKgAAkhyiF7xXpn';

// `VALID_TX` with its last character changed: well formed, so it clears `isSignature` and reaches the probe,
// and held by no cluster, so the probe misses on all three. Verified absent on mainnet, devnet and testnet.
const UNKNOWN_TX = '5ZPbKwtdQmTFq3BKCfBgGi9mr2VkbDnpJjntKsWqrHVaxvkb7nxjryTWyXKmbvmkv332PzQBrtKgAAkhyiF7xXpm';

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];

test.describe('og image request validation', () => {
    test('rejects a malformed signature before reaching the RPC', async ({ request }) => {
        const response = await request.get('/og/tx/not-a-signature');

        expect(response.status()).toBe(400);
        expect(await response.text()).toBe('Invalid transaction signature');
    });

    test('rejects a custom cluster, whose RPC url is caller supplied', async ({ request }) => {
        const response = await request.get(`/og/tx/${VALID_TX}?cluster=custom`);

        expect(response.status()).toBe(400);
        expect(await response.text()).toBe('Invalid cluster');
    });

    test('rejects a cluster slug that is not a known cluster', async ({ request }) => {
        const response = await request.get(`/og/tx/${VALID_TX}?cluster=sandbox`);

        expect(response.status()).toBe(400);
    });
});

test.describe('og image rendering', () => {
    test.describe.configure({ mode: 'serial' });

    test.afterEach(async () => {
        await delay(RPC_COOLDOWN_MS);
    });

    test('renders a resolved transaction as a png at the declared size', async ({ request }) => {
        const response = await request.get(`/og/tx/${VALID_TX}`, { timeout: CONTENT_TIMEOUT });

        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toBe('image/png');
        expect(response.headers()['cache-control']).toContain('max-age=1800');

        const png = new Uint8Array(await response.body());
        expect([...png.subarray(0, PNG_MAGIC.length)]).toEqual(PNG_MAGIC);
        expect(imageSize(png)).toEqual({ height: 630, width: 1200 });
    });

    test('renders the fallback card, on a shorter ttl, for a signature no cluster holds', async ({ request }) => {
        const response = await request.get(`/og/tx/${UNKNOWN_TX}`, { timeout: CONTENT_TIMEOUT });

        // Still an image: a stale link unfurls as a branded card rather than a broken image.
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toBe('image/png');
        // Short, because "not found" only holds until the transaction propagates.
        expect(response.headers()['cache-control']).toContain('max-age=60');

        const png = new Uint8Array(await response.body());
        expect([...png.subarray(0, PNG_MAGIC.length)]).toEqual(PNG_MAGIC);
    });
});

test.describe('transaction page open graph tags', () => {
    test.afterEach(async () => {
        await delay(RPC_COOLDOWN_MS);
    });

    test('declares the image, its size, and the tags Slack needs to unfurl', async ({ page }) => {
        await page.goto(`/tx/${VALID_TX}`, { waitUntil: 'domcontentloaded' });

        expect(await metaProperty(page, 'og:type')).toBe('website');
        expect(await metaProperty(page, 'og:image:width')).toBe('1200');
        expect(await metaProperty(page, 'og:image:height')).toBe('630');
        expect(await metaName(page, 'twitter:card')).toBe('summary_large_image');
        expect(await metaProperty(page, 'og:image')).toContain(`/og/tx/${VALID_TX}`);
        expect(await metaProperty(page, 'og:url')).toContain(`/tx/${VALID_TX}`);
    });

    test('carries the cluster into the image url', async ({ page }) => {
        await page.goto(`/tx/${VALID_TX}?cluster=devnet`, { waitUntil: 'domcontentloaded' });

        expect(await metaProperty(page, 'og:image')).toContain(`/og/tx/${VALID_TX}?cluster=devnet`);
    });
});

/** Width and height from the PNG IHDR chunk, which pins that `IMAGE_SIZE` reached `ImageResponse`. */
function imageSize(png: Uint8Array): { height: number; width: number } {
    const view = new DataView(png.buffer, png.byteOffset, png.byteLength);

    return { height: view.getUint32(20), width: view.getUint32(16) };
}

function metaProperty(page: Page, property: string): Promise<string | null> {
    return page.locator(`meta[property="${property}"]`).getAttribute('content');
}

function metaName(page: Page, name: string): Promise<string | null> {
    return page.locator(`meta[name="${name}"]`).getAttribute('content');
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
