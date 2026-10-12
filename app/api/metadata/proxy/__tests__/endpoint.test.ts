import { getProxiedUri } from '@features/metadata/utils';
import { vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import { STATUS_MESSAGES } from '../feature';
import { GET } from '../route';

const { dnsLookupMock, fetchMock } = vi.hoisted(() => ({
    dnsLookupMock: vi.fn(),
    fetchMock: vi.fn(),
}));

vi.stubGlobal('fetch', fetchMock);

vi.mock('dns', async () => {
    const originalDns = await vi.importActual('dns');
    return {
        ...originalDns,
        default: {
            promises: {
                lookup: dnsLookupMock,
            },
        },
        promises: {
            lookup: dnsLookupMock,
        },
    };
});

const ORIGIN = 'http://localhost:3000';
const ROUTE = `${ORIGIN}/api/metadata/proxy`;

describe('Metadata Proxy Route', () => {
    afterEach(() => {
        vi.clearAllMocks();
        vi.unstubAllEnvs();
    });

    describe('feature toggle', () => {
        it('should return 404 when proxy is disabled', async () => {
            vi.stubEnv('NEXT_PUBLIC_METADATA_ENABLED', 'false');

            // Bypass getProxiedUri — it returns the raw URI when disabled,
            // so we hit the route directly to test its own feature toggle.
            const request = new Request(`${ROUTE}?uri=http%3A%2F%2Fexample.com`);
            const response = await GET(request);
            expect(response.status).toBe(404);
        });
    });

    describe('URI validation', () => {
        it('should return 400 when uri param is missing', async () => {
            vi.stubEnv('NEXT_PUBLIC_METADATA_ENABLED', 'true');

            const request = new Request(ROUTE);
            const response = await GET(request);
            expect(response.status).toBe(400);
        });

        it('should return 400 for malformed URI', async () => {
            vi.stubEnv('NEXT_PUBLIC_METADATA_ENABLED', 'true');

            const request = new Request(`${ROUTE}?uri=not-a-valid-url`);
            const response = await GET(request);
            expect(response.status).toBe(400);
        });

        it('should return 400 for unsupported protocols', async () => {
            vi.stubEnv('NEXT_PUBLIC_METADATA_ENABLED', 'true');

            // Route receives the URI directly — the client would never proxy ftp://,
            // but the route must still reject it.
            const request = new Request(`${ROUTE}?uri=ftp%3A%2F%2Fexample.com%2Ffile.json`);
            const response = await GET(request);
            expect(response.status).toBe(400);
        });

        it('should return 403 when hostname resolves to a private IP', async () => {
            vi.stubEnv('NEXT_PUBLIC_METADATA_ENABLED', 'true');
            dnsLookupMock.mockResolvedValueOnce([{ address: '127.0.0.1' }]);

            const request = new Request(`${ORIGIN}${getProxiedUri('http://external.resource/file.json')}`);
            const response = await GET(request);
            expect(response.status).toBe(403);
        });
    });

    describe('SSRF protection', () => {
        it.each([301, 302, 307, 308])(
            'should return 403 when upstream %i redirect targets a private IP',
            async status => {
                vi.stubEnv('NEXT_PUBLIC_METADATA_ENABLED', 'true');
                // Initial URL resolves to a public IP
                dnsLookupMock.mockResolvedValueOnce([{ address: '8.8.8.8' }]);
                fetchMock.mockResolvedValueOnce(
                    new Response(null, {
                        headers: { Location: 'http://169.254.169.254/latest/meta-data/' },
                        status,
                    }),
                );
                // Redirect target resolves to a private IP — blocked
                dnsLookupMock.mockResolvedValueOnce([{ address: '169.254.169.254' }]);

                const request = new Request(`${ORIGIN}${getProxiedUri('http://attacker.com/redirect')}`);
                const response = await GET(request);
                expect(response.status).toBe(403);
            },
        );
    });

    // The route answers with the status of the StatusError that fetchResource returns, not 500.
    describe('proxy error statuses', () => {
        const TEN_MB = 10 * 1024 * 1024;

        it.each([
            {
                description: '413 when upstream Content-Length exceeds MAX_SIZE',
                mock: () =>
                    fetchMock.mockResolvedValueOnce(
                        new Response('{}', {
                            headers: { 'Content-Length': String(TEN_MB), 'Content-Type': 'application/json' },
                        }),
                    ),
                status: 413,
            },
            {
                description: '415 when upstream returns unsupported content-type',
                mock: () =>
                    fetchMock.mockResolvedValueOnce(
                        new Response('<html></html>', { headers: { 'Content-Type': 'text/html' } }),
                    ),
                status: 415,
            },
            {
                description: '504 when upstream fetch times out',
                mock: () => {
                    const timeoutError = new Error('Upstream timed out');
                    timeoutError.name = 'TimeoutError';
                    fetchMock.mockRejectedValueOnce(timeoutError);
                },
                status: 504,
            },
            {
                description: '502 when the upstream is unreachable (fetch rejects)',
                mock: () => fetchMock.mockRejectedValueOnce(new Error('boom')),
                status: 502,
            },
        ])('should return $description', async ({ mock, status }) => {
            vi.stubEnv('NEXT_PUBLIC_METADATA_ENABLED', 'true');
            dnsLookupMock.mockResolvedValueOnce([{ address: '8.8.8.8' }]);
            mock();

            const request = new Request(`${ORIGIN}${getProxiedUri('http://external.resource/file.json')}`);
            const response = await GET(request);
            expect(response.status).toBe(status);
            // Errors carry a short, browser-only cache so a failed <img> request
            // primes the cache for ProxiedImage's on-error reason probe. Never
            // shared/edge-cached.
            expect(response.headers.get('cache-control')).toBe('private, max-age=30');
            expect(response.headers.get('vercel-cdn-cache-control')).toBeNull();
        });

        it('should log the returned error through the proxy log policy', async () => {
            vi.stubEnv('NEXT_PUBLIC_METADATA_ENABLED', 'true');
            dnsLookupMock.mockResolvedValueOnce([{ address: '8.8.8.8' }]);
            fetchMock.mockResolvedValueOnce(new Response(null, { status: 404 }));

            await GET(new Request(`${ORIGIN}${getProxiedUri('http://external.resource/file.json')}`));

            expect(Logger.warn).toHaveBeenCalledWith('[api:metadata-proxy] Upstream returned error', {
                host: 'external.resource',
                status: 404,
                url: 'http://external.resource/file.json',
            });
        });

        it('should answer 502 and log a warning with the raw status for an unlisted upstream status', async () => {
            vi.stubEnv('NEXT_PUBLIC_METADATA_ENABLED', 'true');
            dnsLookupMock.mockResolvedValueOnce([{ address: '8.8.8.8' }]);
            fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));

            const response = await GET(new Request(`${ORIGIN}${getProxiedUri('http://external.resource/file.json')}`));

            expect(response.status).toBe(502);
            expect(Logger.warn).toHaveBeenCalledWith('[api:metadata-proxy] Unlisted upstream status', {
                host: 'external.resource',
                status: 401,
                url: 'http://external.resource/file.json',
            });
        });

        it('should answer 502 with a Sentry warning when the upstream drops the connection mid-body', async () => {
            vi.stubEnv('NEXT_PUBLIC_METADATA_ENABLED', 'true');
            dnsLookupMock.mockResolvedValueOnce([{ address: '8.8.8.8' }]);
            const body = new ReadableStream({
                start(controller) {
                    controller.error(new Error('terminated'));
                },
            });
            fetchMock.mockResolvedValueOnce(new Response(body, { headers: { 'Content-Type': 'application/json' } }));

            const response = await GET(new Request(`${ORIGIN}${getProxiedUri('http://external.resource/file.json')}`));

            expect(response.status).toBe(502);
            expect(Logger.warn).toHaveBeenCalledWith(
                '[api:metadata-proxy] Fetch failed',
                expect.objectContaining({ sentry: true, url: 'http://external.resource/file.json' }),
            );
            expect(Logger.error).not.toHaveBeenCalled();
        });

        it.each([204, 205])('should answer 415 without a Sentry exception when the upstream sends %i', async status => {
            vi.stubEnv('NEXT_PUBLIC_METADATA_ENABLED', 'true');
            dnsLookupMock.mockResolvedValueOnce([{ address: '8.8.8.8' }]);
            fetchMock.mockResolvedValueOnce(
                new Response(null, { headers: { 'Content-Type': 'application/json' }, status }),
            );

            const response = await GET(new Request(`${ORIGIN}${getProxiedUri('http://external.resource/file.json')}`));

            expect(response.status).toBe(415);
            expect(Logger.error).not.toHaveBeenCalled();
        });

        it('should answer 500 and report a Sentry exception when the route itself throws', async () => {
            const failure = new Error('route fault');
            vi.mocked(Logger.info).mockImplementationOnce(() => {
                throw failure;
            });

            const { response } = await setup('http://external.resource/file.json', {
                upstream: { data: { name: 'NFT' }, headers: { 'Content-Type': 'application/json' } },
            });

            expect(response.status).toBe(500);
            expect(Logger.error).toHaveBeenCalledWith(failure, {
                sentry: true,
                sentryExtras: { uri: 'http://external.resource/file.json' },
            });
        });
    });

    describe('upstream Retry-After', () => {
        it.each([
            { expected: '120', retryAfter: '120', status: 429 },
            { expected: null, retryAfter: undefined, status: 429 },
            { expected: null, retryAfter: '120', status: 503 },
        ] as const)(
            'should respond $status with Retry-After $expected when upstream sends $retryAfter',
            async ({ expected, retryAfter, status }) => {
                vi.stubEnv('NEXT_PUBLIC_METADATA_ENABLED', 'true');
                dnsLookupMock.mockResolvedValueOnce([{ address: '8.8.8.8' }]);
                fetchMock.mockResolvedValueOnce(
                    new Response(null, { headers: retryAfter ? { 'Retry-After': retryAfter } : {}, status }),
                );

                const request = new Request(`${ORIGIN}${getProxiedUri('http://external.resource/file.json')}`);
                const response = await GET(request);

                expect(response.status).toBe(status);
                expect(response.headers.get('retry-after')).toBe(expected);
                expect(await response.json()).toEqual({ error: STATUS_MESSAGES[status] });
            },
        );
    });

    describe('successful response', () => {
        it('should return 200, forward content-type, drop the upstream ETag, and set a browser-only cache policy', async () => {
            const { response } = await setup('http://external.resource/file.json', {
                upstream: {
                    data: { attributes: [], name: 'NFT' },
                    headers: {
                        // Upstream Cache-Control is overridden, not forwarded.
                        'Cache-Control': 'max-age=3600',
                        'Content-Type': 'application/json',
                        ETag: 'test-etag',
                    },
                },
            });

            expect(response.status).toBe(200);
            expect(response.headers.get('content-type')).toBe('application/json');
            // The upstream ETag is not forwarded: the route does no conditional
            // revalidation, so the validator would be inert.
            expect(response.headers.get('etag')).toBeNull();
            // Browser caches for a day; the edge does not (no Vercel-CDN-Cache-Control),
            // and the upstream's own value is not forwarded.
            expect(response.headers.get('cache-control')).toBe('public, max-age=86400');
            expect(response.headers.get('vercel-cdn-cache-control')).toBeNull();
        });

        it('should log the fetched size of a successful response', async () => {
            await setup('http://external.resource/file.json', {
                upstream: { data: { name: 'NFT' }, headers: { 'Content-Type': 'application/json' } },
            });

            expect(Logger.info).toHaveBeenCalledWith(
                '[api:metadata-proxy] Resource fetched',
                expect.objectContaining({ contentType: 'application/json', host: 'external.resource' }),
            );
        });

        it('should omit Content-Length to avoid browser CORS issues', async () => {
            const { response } = await setup('http://google.com/metadata.json', {
                upstream: {
                    data: { name: 'Test NFT' },
                    headers: {
                        'Cache-Control': 'max-age=3600',
                        'Content-Length': '140',
                        'Content-Type': 'application/json',
                        ETag: 'test-etag',
                    },
                },
            });

            expect(response.status).toBe(200);
            expect(response.headers.get('content-length')).toBeNull();
        });
    });

    // Verifies that searchParams.get() is the only decode step — an extra
    // decodeURIComponent would corrupt URIs containing percent-encoded characters.
    describe('URI encoding round-trip (no double-decoding)', () => {
        const upstreamJson = {
            data: { name: 'Test' },
            headers: {
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/json',
                ETag: 'test-etag',
            },
        };

        it.each([
            ['plain URL', 'https://arweave.net/abc123'],
            ['%20 (space) in path', 'https://arweave.net/hello%20world.json'],
            ['%23 (hash) in path', 'https://example.com/file%23name.json'],
            ['%2F (slash) in query', 'https://example.com/api?path=%2Ffoo%2Fbar'],
            ['multiple %20 (spaced words) in path', 'https://arweave.net/my%20cool%20nft%20metadata.json'],
            // %2520 means the literal path contains "%20" (the % is encoded as %25).
            // The proxy must fetch it as-is — decoding it to %20 would hit a different resource.
            // If the on-chain program stored this by mistake, that's the program's bug, not ours.
            ['nested %2520 (literal %20 in path)', 'https://arweave.net/hello%2520world.json'],
            ['nested %2523 (literal %23 in path)', 'https://example.com/file%2523name.json'],
        ])('should preserve %s', async (_label, uri) => {
            const { response, fetchedUrl } = await setup(uri, { upstream: upstreamJson });

            expect(response.status).toBe(200);
            expect(fetchedUrl()).toBe(uri);
        });
    });
});

interface SetupOptions {
    enabled?: boolean;
    upstream?: {
        data: object;
        headers: Record<string, string>;
    };
}

async function setup(uri: string, options: SetupOptions = {}) {
    const { enabled = true, upstream } = options;

    vi.stubEnv('NEXT_PUBLIC_METADATA_ENABLED', enabled ? 'true' : 'false');

    if (upstream) {
        dnsLookupMock.mockResolvedValueOnce([{ address: '8.8.8.8' }]);
        fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(upstream.data), { headers: upstream.headers }));
    }

    const request = new Request(`${ORIGIN}${getProxiedUri(uri)}`);
    const response = await GET(request);

    return {
        fetchedUrl: () => fetchMock.mock.calls[0][0],
        response,
    };
}
