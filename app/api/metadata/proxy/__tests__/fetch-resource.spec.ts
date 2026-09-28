import type { LookupAddress } from 'dns';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { unwrap } from '@/app/shared/lib/result';

import { type FetchRequest, fetchResource } from '../feature';
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

    async function fetchError(request: Omit<FetchRequest, 'headers'> = { size: 100, timeout: 100 }) {
        const [error] = await fetchResource(uri, { headers, ...request });
        return error;
    }

    beforeEach(() => {
        // Default: every hop resolves to a public IP unless a test says otherwise.
        vi.mocked(lookupHostnameSafely).mockResolvedValue(publicLookup());
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should be called with proper arguments', async () => {
        mockJsonResponseOnce({}, 'application/json, charset=utf-8');

        const resource = unwrap(await fetchResource(uri, { headers, size: 100, timeout: 100 }));

        expect(fetchMock).toHaveBeenCalledWith(uri, expect.objectContaining({ redirect: 'manual' }));
        expect(resource).toMatchObject({ byteLength: 2, data: {}, host: 'hello.world' });
    });

    it('should return an error for unsupported media', async () => {
        // Empty body with no recognized content-type → unsupported.
        mockResponseOnce(null);

        expect(await fetchError()).toMatchObject({ code: 'unsupported-content-type', status: 415 });
    });

    it('should return an error upon exceeded size when fetch rejects', async () => {
        mockRejectOnce(new Error('FetchError: content size at https://path/to/resour.ce over limit: 100'));

        expect(await fetchError()).toMatchObject({
            code: 'oversize-streamed',
            context: { host: 'hello.world', maxSize: 100 },
            status: 413,
        });
    });

    it('should return an error when content-length exceeds limit', async () => {
        // Pre-check via Content-Length header — fast-fails before reading the body.
        const big = new Uint8Array(50_000);
        mockResponseOnce(big, {
            headers: { 'Content-Length': '50000', 'Content-Type': 'application/json' },
        });

        expect(await fetchError()).toMatchObject({
            code: 'oversize-declared',
            context: { declaredContentLength: 50_000, host: 'hello.world', maxSize: 100 },
            status: 413,
        });
    });

    it('should return an error when streamed body exceeds limit without Content-Length', async () => {
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

        expect(await fetchError()).toMatchObject({
            code: 'oversize-streamed',
            context: { host: 'hello.world', maxSize: 100 },
            status: 413,
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

        expect(await fetchError()).toMatchObject({ code: 'timeout', status: 504 });
    });

    it('should treat an unexpected fetch rejection as an unreachable upstream (502)', async () => {
        fetchMock.mockRejectedValueOnce({ data: 'unexpected exception' });

        expect(await fetchError()).toMatchObject({ code: 'unreachable', context: { url: uri }, status: 502 });
    });

    it('should handle malformed JSON response gracefully', async () => {
        mockResponseOnce('<html>not json</html>', {
            headers: { 'Content-Type': 'application/json' },
        });

        expect(await fetchError({ size: 1000, timeout: 1000 })).toMatchObject({
            code: 'malformed-json',
            status: 415,
        });
    });

    it('should preserve a listed upstream status', async () => {
        mockResponseOnce(null, { headers: { 'Content-Type': 'text/html' }, status: 404 });

        expect(await fetchError()).toMatchObject({
            code: 'upstream-status',
            context: { host: 'hello.world', status: 404, url: uri },
            status: 404,
        });
    });

    it('should carry Retry-After on an upstream 429', async () => {
        mockResponseOnce(null, { headers: { 'Retry-After': '120' }, status: 429 });

        expect(await fetchError()).toMatchObject({ retryAfter: '120', status: 429 });
    });

    it('should follow redirect when target resolves to a public IP', async () => {
        mockRedirectOnce('http://cdn.hello.world/data.json');
        vi.mocked(lookupHostnameSafely).mockResolvedValueOnce(publicLookup());
        mockJsonResponseOnce({ redirected: true });

        const resource = unwrap(await fetchResource(uri, { headers, size: 1000, timeout: 100 }));

        expect(resource).toMatchObject({ data: { redirected: true }, host: 'cdn.hello.world' });
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should block redirect to a private IP (SSRF protection)', async () => {
        mockRedirectOnce('http://169.254.169.254/latest/meta-data/');
        vi.mocked(lookupHostnameSafely).mockResolvedValueOnce(publicLookup()).mockResolvedValueOnce({
            kind: 'private',
            reason: 'private address 169.254.169.254',
        });

        expect(await fetchError()).toMatchObject({
            code: 'ssrf-blocked',
            context: { hostname: '169.254.169.254', reason: 'private address 169.254.169.254' },
            status: 403,
        });
    });

    it('should carry the DNS error in the log context of a blocked hostname', async () => {
        const dnsError = new Error('getaddrinfo ENOTFOUND hello.world');
        vi.mocked(lookupHostnameSafely).mockResolvedValueOnce({
            cause: dnsError,
            kind: 'private',
            reason: 'DNS resolution failed',
        });

        expect(await fetchError()).toMatchObject({
            code: 'ssrf-blocked',
            context: { error: dnsError, hostname: 'hello.world', reason: 'DNS resolution failed' },
        });
    });

    it('should return 502 when redirect has no Location header', async () => {
        mockResponseOnce(null, { status: 302 });

        expect(await fetchError()).toMatchObject({ code: 'redirect-missing-location', status: 502 });
    });

    // 304/305 are 3xx but don't carry a Location header by spec; they must be
    // classified as upstream errors, not as redirects with a missing Location.
    it.each([304, 305])('should classify %i as an unlisted upstream error, not a redirect', async status => {
        mockResponseOnce(null, { status });

        expect(await fetchError()).toMatchObject({
            code: 'unlisted-upstream-status',
            context: { host: 'hello.world', status, url: uri },
            status: 502,
        });
    });

    it('should return 502 after too many redirects', async () => {
        // 4 consecutive redirects (exceeds MAX_REDIRECTS of 3)
        for (let i = 0; i < 4; i++) {
            mockRedirectOnce(`http://hop${i}.example.com/`);
            vi.mocked(lookupHostnameSafely).mockResolvedValueOnce(publicLookup());
        }

        expect(await fetchError()).toMatchObject({ code: 'too-many-redirects', status: 502 });
    });

    it('should return 502 when a redirect loop is detected', async () => {
        mockRedirectOnce('http://b.example.com/');
        vi.mocked(lookupHostnameSafely).mockResolvedValueOnce(publicLookup());
        mockRedirectOnce(uri);
        vi.mocked(lookupHostnameSafely).mockResolvedValueOnce(publicLookup());

        expect(await fetchError()).toMatchObject({ code: 'redirect-loop', status: 502 });

        // Should bail after 2 fetches, not exhaust MAX_REDIRECTS
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should block redirect to non-HTTP protocol', async () => {
        mockRedirectOnce('file:///etc/passwd');

        expect(await fetchError()).toMatchObject({ code: 'non-http-protocol', status: 403 });
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

        await fetchResource(uri, { headers, size: 100, timeout: 100 });

        // One hop, one resolution. If a second resolution snuck in we'd see 2.
        expect(lookupHostnameSafely).toHaveBeenCalledTimes(1);
        expect(lookupHostnameSafely).toHaveBeenCalledWith(new URL(uri).hostname);
    });

    it('should resolve each redirect hop exactly once before fetching', async () => {
        // 2 hops total: initial + one redirect target. Both resolve to public.
        mockRedirectOnce('http://cdn.hello.world/data.json');
        mockJsonResponseOnce({ ok: true });

        await fetchResource(uri, { headers, size: 1000, timeout: 100 });

        expect(lookupHostnameSafely).toHaveBeenCalledTimes(2);
        expect(lookupHostnameSafely).toHaveBeenNthCalledWith(1, 'hello.world');
        expect(lookupHostnameSafely).toHaveBeenNthCalledWith(2, 'cdn.hello.world');
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
});
