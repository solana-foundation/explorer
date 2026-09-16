import { gen } from '@__fixtures__/gen';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// The real client page pulls in providers, SWR and the PDF stack. generateMetadata never touches it.
vi.mock('../page-client', () => ({
    TransactionDetailsPageClient: () => null,
}));

const SIGNATURE = gen.signature(1);
const BASE_URL = 'https://explorer.solana.com';

describe('should generate transaction page metadata', () => {
    beforeEach(() => {
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    it('should emit og:type, og:url and a 1200x630 og:image on the default view', async () => {
        const { generateMetadata } = await import('../page');

        const metadata = await generateMetadata({
            params: Promise.resolve({ signature: SIGNATURE }),
            searchParams: Promise.resolve({}),
        });

        expect(metadata.openGraph).toMatchObject({
            images: [{ height: 630, url: `${BASE_URL}/og/tx/${SIGNATURE}`, width: 1200 }],
            type: 'website',
            url: `${BASE_URL}/tx/${SIGNATURE}`,
        });
    });

    it('should carry the cluster into both urls on the default view', async () => {
        const { generateMetadata } = await import('../page');

        const metadata = await generateMetadata({
            params: Promise.resolve({ signature: SIGNATURE }),
            searchParams: Promise.resolve({ cluster: 'devnet' }),
        });

        expect(metadata.openGraph).toMatchObject({
            images: [{ url: `${BASE_URL}/og/tx/${SIGNATURE}?cluster=devnet` }],
            url: `${BASE_URL}/tx/${SIGNATURE}?cluster=devnet`,
        });
    });

    it('should keep the tags but drop the image on a custom cluster', async () => {
        const { generateMetadata } = await import('../page');

        const metadata = await generateMetadata({
            params: Promise.resolve({ signature: SIGNATURE }),
            searchParams: Promise.resolve({ cluster: 'custom', customUrl: 'http://localhost:8899' }),
        });

        expect(metadata.openGraph).toMatchObject({
            description: `Details of the Solana transaction with signature ${SIGNATURE}`,
            title: `Transaction | ${SIGNATURE} | Solana`,
            type: 'website',
            url: `${BASE_URL}/tx/${SIGNATURE}`,
        });
        expect(metadata.openGraph).not.toHaveProperty('images');
        expect(metadata.twitter).toMatchObject({ card: 'summary' });
        expect(metadata.twitter).not.toHaveProperty('images');
        expect(JSON.stringify(metadata)).not.toContain('localhost');
    });

    it('should show the mainnet image on an unknown cluster slug', async () => {
        const { generateMetadata } = await import('../page');

        const metadata = await generateMetadata({
            params: Promise.resolve({ signature: SIGNATURE }),
            searchParams: Promise.resolve({ cluster: 'bogus' }),
        });

        expect(metadata.openGraph).toMatchObject({
            images: [{ url: `${BASE_URL}/og/tx/${SIGNATURE}` }],
        });
    });

    it('should drop the receipt image on a custom cluster', async () => {
        vi.stubEnv('NEXT_PUBLIC_RECEIPT_ENABLED', 'true');
        const { generateMetadata } = await import('../page');

        const metadata = await generateMetadata({
            params: Promise.resolve({ signature: SIGNATURE }),
            searchParams: Promise.resolve({
                cluster: 'custom',
                customUrl: 'http://localhost:8899',
                view: 'receipt',
            }),
        });

        expect(metadata.openGraph).toMatchObject({
            type: 'website',
            url: `${BASE_URL}/tx/${SIGNATURE}?view=receipt`,
        });
        expect(metadata.openGraph).not.toHaveProperty('images');
        expect(metadata.twitter).toMatchObject({ card: 'summary' });
        expect(metadata.twitter).not.toHaveProperty('images');
        expect(JSON.stringify(metadata)).not.toContain('localhost');
    });

    it('should set a large summary twitter card pointing at the same image', async () => {
        const { generateMetadata } = await import('../page');

        const metadata = await generateMetadata({
            params: Promise.resolve({ signature: SIGNATURE }),
            searchParams: Promise.resolve({}),
        });

        expect(metadata.twitter).toMatchObject({
            card: 'summary_large_image',
            images: [`${BASE_URL}/og/tx/${SIGNATURE}`],
        });
    });

    it('should leave the receipt view metadata unchanged', async () => {
        vi.stubEnv('NEXT_PUBLIC_RECEIPT_ENABLED', 'true');
        const { generateMetadata } = await import('../page');

        const metadata = await generateMetadata({
            params: Promise.resolve({ signature: SIGNATURE }),
            searchParams: Promise.resolve({ view: 'receipt' }),
        });

        expect(metadata.openGraph).toMatchObject({
            images: [{ url: `${BASE_URL}/og/receipt/${SIGNATURE}` }],
            type: 'website',
            url: `${BASE_URL}/tx/${SIGNATURE}?view=receipt`,
        });
    });
});
