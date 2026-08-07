import type { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getProxiedUri: vi.fn() }));

vi.mock('@/app/features/metadata/utils', () => ({ getProxiedUri: mocks.getProxiedUri }));

const PROXY_PATH = '/api/metadata/proxy?uri=https%3A%2F%2Fexample.com%2Fmeta.json';

function metadata(uri: string) {
    return { uri } as Metadata;
}

function jsonResponse(body: unknown, ok = true) {
    return { json: () => Promise.resolve(body), ok } as Response;
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

    // The browser resolves a root-relative proxy path against the current page.
    it('should fetch the proxy path as given', async () => {
        mocks.getProxiedUri.mockReturnValue(PROXY_PATH);

        const { getMetadataJson } = await import('../get-metadata-json');
        await getMetadataJson(metadata('https://example.com/meta.json'));

        expect(global.fetch).toHaveBeenCalledWith(PROXY_PATH);
    });

    it('should fetch an unproxied URI as given, since the browser uses its own network', async () => {
        mocks.getProxiedUri.mockReturnValue('https://ipfs.io/ipfs/abc');

        const { getMetadataJson } = await import('../get-metadata-json');
        await getMetadataJson(metadata('ipfs://abc'));

        expect(global.fetch).toHaveBeenCalledWith('https://ipfs.io/ipfs/abc');
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

    // The proxy answers a blocked or dead URI with `{ error: … }`. That body names no artwork, so
    // `processJson` would hand it back as metadata if the status were not checked first.
    it('should resolve undefined for an error response rather than read its body as metadata', async () => {
        mocks.getProxiedUri.mockReturnValue(PROXY_PATH);
        vi.mocked(global.fetch).mockResolvedValueOnce(jsonResponse({ error: 'Forbidden' }, false));

        const { getMetadataJson } = await import('../get-metadata-json');

        await expect(getMetadataJson(metadata('https://example.com/meta.json'))).resolves.toBeUndefined();
    });

    it('should not report an unparseable body', async () => {
        mocks.getProxiedUri.mockReturnValue('https://example.com/meta.json');
        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: () => Promise.reject(new SyntaxError('Unexpected token <')),
            ok: true,
        } as unknown as Response);
        const onError = vi.fn();

        const { getMetadataJson } = await import('../get-metadata-json');

        await expect(getMetadataJson(metadata('https://example.com/meta.json'), { onError })).resolves.toBeUndefined();
        expect(onError).not.toHaveBeenCalled();
    });

    it('should resolve undefined when the metadata carries no URI', async () => {
        const { getMetadataJson } = await import('../get-metadata-json');

        await expect(getMetadataJson(metadata(''))).resolves.toBeUndefined();
        expect(global.fetch).not.toHaveBeenCalled();
    });
});
