import type { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getProxiedUri: vi.fn() }));

vi.mock('@/app/features/metadata/utils', () => ({ getProxiedUri: mocks.getProxiedUri }));

const PROXY_PATH = '/api/metadata/proxy?uri=https%3A%2F%2Fexample.com%2Fmeta.json';

function metadata(uri: string) {
    return { uri } as Metadata;
}

function jsonResponse(body: unknown) {
    return { json: () => Promise.resolve(body) } as Response;
}

describe('getMetadataJson', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn().mockResolvedValue(jsonResponse({ image: 'https://example.com/logo.png' }));
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('should resolve a root-relative proxy path against the given origin', async () => {
        mocks.getProxiedUri.mockReturnValue(PROXY_PATH);

        const { getMetadataJson } = await import('../get-metadata-json');
        await getMetadataJson(metadata('https://example.com/meta.json'), { baseUrl: 'http://localhost:3000' });

        expect(global.fetch).toHaveBeenCalledWith(`http://localhost:3000${PROXY_PATH}`, expect.anything());
    });

    it('should leave a root-relative proxy path alone in the browser, where no origin is given', async () => {
        mocks.getProxiedUri.mockReturnValue(PROXY_PATH);

        const { getMetadataJson } = await import('../get-metadata-json');
        await getMetadataJson(metadata('https://example.com/meta.json'));

        expect(global.fetch).toHaveBeenCalledWith(PROXY_PATH, expect.anything());
    });

    it('should leave an absolute URI unchanged even when an origin is given', async () => {
        mocks.getProxiedUri.mockReturnValue('https://ipfs.io/ipfs/abc');

        const { getMetadataJson } = await import('../get-metadata-json');
        await getMetadataJson(metadata('ipfs://abc'), { baseUrl: 'http://localhost:3000' });

        expect(global.fetch).toHaveBeenCalledWith('https://ipfs.io/ipfs/abc', expect.anything());
    });

    it('should forward the abort signal so callers can bound the wait', async () => {
        mocks.getProxiedUri.mockReturnValue('https://example.com/meta.json');
        const controller = new AbortController();

        const { getMetadataJson } = await import('../get-metadata-json');
        await getMetadataJson(metadata('https://example.com/meta.json'), { signal: controller.signal });

        expect(global.fetch).toHaveBeenCalledWith(
            'https://example.com/meta.json',
            expect.objectContaining({ signal: controller.signal }),
        );
    });

    it('should resolve undefined when the request fails', async () => {
        mocks.getProxiedUri.mockReturnValue('https://example.com/meta.json');
        vi.mocked(global.fetch).mockRejectedValueOnce(new Error('aborted'));

        const { getMetadataJson } = await import('../get-metadata-json');

        await expect(getMetadataJson(metadata('https://example.com/meta.json'))).resolves.toBeUndefined();
    });

    // The NFT page maps `onError` to `Logger.error`. Dead and slow third-party metadata links are
    // routine, so only bad input may be reported — otherwise the ordinary case escalates.
    it('should not report a failed request, which is routine for third-party metadata', async () => {
        mocks.getProxiedUri.mockReturnValue('https://example.com/meta.json');
        vi.mocked(global.fetch).mockRejectedValueOnce(new Error('socket hang up'));
        const onError = vi.fn();

        const { getMetadataJson } = await import('../get-metadata-json');
        await getMetadataJson(metadata('https://example.com/meta.json'), { onError });

        expect(onError).not.toHaveBeenCalled();
    });

    it('should not report an unparseable body', async () => {
        mocks.getProxiedUri.mockReturnValue('https://example.com/meta.json');
        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: () => Promise.reject(new SyntaxError('Unexpected token <')),
        } as unknown as Response);
        const onError = vi.fn();

        const { getMetadataJson } = await import('../get-metadata-json');

        await expect(getMetadataJson(metadata('https://example.com/meta.json'), { onError })).resolves.toBeUndefined();
        expect(onError).not.toHaveBeenCalled();
    });

    it('should report a malformed origin, which is bad input rather than a dead link', async () => {
        mocks.getProxiedUri.mockReturnValue(PROXY_PATH);
        const onError = vi.fn();

        const { getMetadataJson } = await import('../get-metadata-json');

        await expect(
            getMetadataJson(metadata('https://example.com/meta.json'), { baseUrl: 'not-an-origin', onError }),
        ).resolves.toBeUndefined();
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should resolve undefined when the metadata carries no URI', async () => {
        const { getMetadataJson } = await import('../get-metadata-json');

        await expect(getMetadataJson(metadata(''))).resolves.toBeUndefined();
        expect(global.fetch).not.toHaveBeenCalled();
    });
});
