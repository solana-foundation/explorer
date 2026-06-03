import { getProxiedUri } from '@features/metadata/utils';
import { vi } from 'vitest';

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

    // Locks in the original passthrough contract: when fetchResource throws a
    // StatusError with one of these statuses, the route must surface it as-is
    // rather than collapsing to 500.
    describe('upstream status passthrough', () => {
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
                description: '500 on unclassified upstream failure',
                mock: () => fetchMock.mockRejectedValueOnce(new Error('boom')),
                status: 500,
            },
        ])('should return $description', async ({ mock, status }) => {
            vi.stubEnv('NEXT_PUBLIC_METADATA_ENABLED', 'true');
            dnsLookupMock.mockResolvedValueOnce([{ address: '8.8.8.8' }]);
            mock();

            const request = new Request(`${ORIGIN}${getProxiedUri('http://external.resource/file.json')}`);
            const response = await GET(request);
            expect(response.status).toBe(status);
            // Errors must not be edge-cached.
            expect(response.headers.get('vercel-cdn-cache-control')).toBeNull();
        });
    });

    describe('successful response', () => {
        it('should return 200, forward content-type/etag, and set its own cache policy', async () => {
            const { response } = await setup('http://external.resource/file.json', {
                upstream: {
                    data: { attributes: [], name: 'NFT' },
                    headers: {
                        // Upstream Cache-Control is intentionally overridden, not forwarded.
                        'Cache-Control': 'max-age=3600',
                        'Content-Type': 'application/json',
                        ETag: 'test-etag',
                    },
                },
            });

            expect(response.status).toBe(200);
            expect(response.headers.get('content-type')).toBe('application/json');
            expect(response.headers.get('etag')).toBe('test-etag');
            // Our own edge-caching policy, not the upstream's value.
            expect(response.headers.get('cache-control')).toBe('public, max-age=300');
            expect(response.headers.get('vercel-cdn-cache-control')).toBe(
                'public, s-maxage=86400, stale-while-revalidate=604800',
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
