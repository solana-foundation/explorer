import type { LookupAddress } from 'dns';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { fetchResource } from '../feature';
import { lookupHostnameSafely } from '../feature/ip';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

vi.mock('../feature/ip', async () => {
    const actual = await vi.importActual('../feature/ip');
    return {
        ...actual,
        lookupHostnameSafely: vi.fn(),
    };
});

// By default every hop resolves to a public IP so test bodies only override
// for SSRF/private-IP cases. The returned `lookup` is a no-op stub — undici
// never actually connects in these tests (the global `fetch` is mocked).
function publicLookup(address = '8.8.8.8'): { kind: 'public'; lookup: () => void; addresses: LookupAddress[] } {
    return { addresses: [{ address, family: 4 }], kind: 'public', lookup: () => undefined };
}

function mockJsonResponseOnce(data: unknown, contentType = 'application/json') {
    fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(data), {
            headers: { 'Content-Type': contentType },
        }),
    );
}

function mockResponseOnce(body: BodyInit | null, init?: ResponseInit) {
    fetchMock.mockResolvedValueOnce(new Response(body, init));
}

function mockRedirectOnce(location: string, status = 302) {
    fetchMock.mockResolvedValueOnce(new Response(null, { headers: { Location: location }, status }));
}

function mockRejectOnce<T extends Error>(error: T) {
    fetchMock.mockRejectedValueOnce(error);
}

describe('fetchResource', () => {
    const uri = 'http://hello.world/data.json';
    const headers = new Headers({ 'Content-Type': 'application/json' });

    beforeEach(() => {
        // Default: every hop resolves to a public IP unless a test says otherwise.
        vi.mocked(lookupHostnameSafely).mockResolvedValue(publicLookup());
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should be called with proper arguments', async () => {
        mockJsonResponseOnce({}, 'application/json, charset=utf-8');

        const resource = await fetchResource(uri, headers, 100, 100);

        expect(fetchMock).toHaveBeenCalledWith(uri, expect.objectContaining({ redirect: 'manual' }));
        expect(resource.data).toEqual({});
    });

    it('should throw exception for unsupported media', async () => {
        // Empty body with no recognized content-type → unsupported.
        mockResponseOnce(null);

        await expect(() => {
            return fetchResource(uri, headers, 100, 100);
        }).rejects.toMatchObject({ status: 415 });
    });

    it('should throw exception upon exceeded size when fetch rejects', async () => {
        mockRejectOnce(new Error('FetchError: content size at https://path/to/resour.ce over limit: 100'));

        await expect(() => {
            return fetchResource(uri, headers, 100, 100);
        }).rejects.toMatchObject({ status: 413 });
    });

    it('should throw exception when content-length exceeds limit', async () => {
        // Pre-check via Content-Length header — fast-fails before reading the body.
        const big = new Uint8Array(50_000);
        mockResponseOnce(big, {
            headers: { 'Content-Length': '50000', 'Content-Type': 'application/json' },
        });

        await expect(() => {
            return fetchResource(uri, headers, 100, 100);
        }).rejects.toMatchObject({ status: 413 });
        expect(Logger.warn).toHaveBeenCalledWith('[api:metadata-proxy] Resource exceeds max size (Content-Length)', {
            sentry: true,
            sentryExtras: { declaredContentLength: 50_000, host: 'hello.world', maxSize: 100 },
        });
    });

    it('should throw exception when streamed body exceeds limit without Content-Length', async () => {
        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(new Uint8Array(60));
                controller.enqueue(new Uint8Array(60));
                controller.close();
            },
        });
        fetchMock.mockResolvedValueOnce(
            new Response(stream, {
                headers: { 'Content-Type': 'application/json' },
            }),
        );

        await expect(() => {
            return fetchResource(uri, headers, 100, 100);
        }).rejects.toMatchObject({ status: 413 });
        expect(Logger.warn).toHaveBeenCalledWith('[api:metadata-proxy] Resource exceeds max size (streamed)', {
            sentry: true,
            sentryExtras: { host: 'hello.world', maxSize: 100 },
        });
    });

    it('should handle AbortSignal', async () => {
        class TimeoutError extends Error {
            constructor() {
                super();
                this.name = 'TimeoutError';
            }
        }
        mockRejectOnce(new TimeoutError());

        await expect(() => {
            return fetchResource(uri, headers, 100, 100);
        }).rejects.toMatchObject({ status: 504 });
    });

    it('should handle size overflow', async () => {
        mockRejectOnce(new Error('file is over limit: 100'));

        await expect(() => {
            return fetchResource(uri, headers, 100, 100);
        }).rejects.toMatchObject({ status: 413 });
    });

    it('should handle unexpected result', async () => {
        fetchMock.mockRejectedValueOnce({ data: 'unexpected exception' });

        await expect(fetchResource(uri, headers, 100, 100)).rejects.toMatchObject({ status: 500 });
    });

    it('should handle malformed JSON response gracefully', async () => {
        mockResponseOnce('<html>not json</html>', {
            headers: { 'Content-Type': 'application/json' },
        });

        await expect(fetchResource(uri, headers, 1000, 1000)).rejects.toMatchObject({ status: 415 });
    });

    it('should warn to Sentry when fetch fails with a general error', async () => {
        mockRejectOnce(new Error('connection refused'));

        await expect(fetchResource(uri, headers, 100, 100)).rejects.toThrow();

        expect(Logger.warn).toHaveBeenCalledWith('[api:metadata-proxy] Fetch failed', {
            sentry: true,
            url: uri,
        });
    });

    it('should throw 502 when upstream returns a non-2xx status', async () => {
        mockResponseOnce(null, { headers: { 'Content-Type': 'text/html' }, status: 403 });

        await expect(fetchResource(uri, headers, 100, 100)).rejects.toMatchObject({ status: 502 });

        expect(Logger.warn).toHaveBeenCalledWith('[api:metadata-proxy] Upstream returned error', {
            status: 403,
            url: uri,
        });
    });

    it('should follow redirect when target resolves to a public IP', async () => {
        mockRedirectOnce('http://cdn.hello.world/data.json');
        vi.mocked(lookupHostnameSafely).mockResolvedValueOnce(publicLookup());
        mockJsonResponseOnce({ redirected: true });

        const result = await fetchResource(uri, headers, 100, 1000);

        expect(result.data).toEqual({ redirected: true });
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should block redirect to a private IP (SSRF protection)', async () => {
        mockRedirectOnce('http://169.254.169.254/latest/meta-data/');
        vi.mocked(lookupHostnameSafely).mockResolvedValueOnce({
            kind: 'private',
            reason: 'private address 169.254.169.254',
        });

        await expect(fetchResource(uri, headers, 100, 100)).rejects.toMatchObject({ status: 403 });
    });

    it('should throw 502 when redirect has no Location header', async () => {
        mockResponseOnce(null, { status: 302 });

        await expect(fetchResource(uri, headers, 100, 100)).rejects.toMatchObject({ status: 502 });
    });

    // 304/305 are 3xx but don't carry a Location header by spec; they must be
    // classified as upstream errors, not as redirects with a missing Location.
    it.each([304, 305])('should classify %i as an upstream error, not a redirect', async status => {
        mockResponseOnce(null, { status });

        await expect(fetchResource(uri, headers, 100, 100)).rejects.toMatchObject({ status: 502 });

        expect(Logger.warn).toHaveBeenCalledWith('[api:metadata-proxy] Upstream returned error', {
            status,
            url: uri,
        });
    });

    it('should throw 502 after too many redirects', async () => {
        // 4 consecutive redirects (exceeds MAX_REDIRECTS of 3)
        for (let i = 0; i < 4; i++) {
            mockRedirectOnce(`http://hop${i}.example.com/`);
            vi.mocked(lookupHostnameSafely).mockResolvedValueOnce(publicLookup());
        }

        await expect(fetchResource(uri, headers, 100, 100)).rejects.toMatchObject({ status: 502 });
    });

    it('should throw 502 when a redirect loop is detected', async () => {
        mockRedirectOnce('http://b.example.com/');
        vi.mocked(lookupHostnameSafely).mockResolvedValueOnce(publicLookup());
        mockRedirectOnce(uri);
        vi.mocked(lookupHostnameSafely).mockResolvedValueOnce(publicLookup());

        await expect(fetchResource(uri, headers, 100, 100)).rejects.toMatchObject({ status: 502 });

        // Should bail after 2 fetches, not exhaust MAX_REDIRECTS
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should block redirect to non-HTTP protocol', async () => {
        mockRedirectOnce('file:///etc/passwd');

        await expect(fetchResource(uri, headers, 100, 100)).rejects.toMatchObject({ status: 403 });
    });

    // DNS-rebinding (TOCTOU) regression. The legacy code resolved DNS once for
    // validation, then `fetch()` resolved DNS a *second* time — leaving a
    // window where a malicious authoritative server could answer "public" then
    // "private". The new code pins the validated addresses via undici's
    // connect.lookup, so the kernel sees only the IP we approved.
    //
    // We assert that `lookupHostnameSafely` is called *once per hop* and the
    // hop fetches against that pinned lookup, never re-resolving externally.
    it('should resolve the hostname exactly once per hop (no second DNS lookup before connect)', async () => {
        mockJsonResponseOnce({ ok: true });

        await fetchResource(uri, headers, 100, 100);

        // One hop, one resolution. If a second resolution snuck in we'd see 2.
        expect(lookupHostnameSafely).toHaveBeenCalledTimes(1);
        expect(lookupHostnameSafely).toHaveBeenCalledWith(new URL(uri).hostname);
    });

    it('should resolve each redirect hop exactly once before fetching', async () => {
        // 2 hops total: initial + one redirect target. Both resolve to public.
        mockRedirectOnce('http://cdn.hello.world/data.json');
        mockJsonResponseOnce({ ok: true });

        await fetchResource(uri, headers, 100, 1000);

        expect(lookupHostnameSafely).toHaveBeenCalledTimes(2);
        expect(lookupHostnameSafely).toHaveBeenNthCalledWith(1, 'hello.world');
        expect(lookupHostnameSafely).toHaveBeenNthCalledWith(2, 'cdn.hello.world');
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
});
