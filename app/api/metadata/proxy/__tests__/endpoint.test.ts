import _dns from 'dns';
import { vi } from 'vitest';

import { GET } from '../route';

const dns = _dns.promises;

function setEnvironment(key: string, value: string) {
    Object.assign(process.env, { ...process.env, [key]: value });
}

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

vi.mock('dns', async () => {
    const originalDns = await vi.importActual('dns');
    const lookupFn = vi.fn();
    return {
        ...originalDns,
        default: {
            promises: {
                lookup: lookupFn,
            },
        },
        promises: {
            lookup: lookupFn,
        },
    };
});

function mockFileResponseOnce(data: unknown, headers: Record<string, string>) {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(data), { headers }));
}

const ORIGIN = 'http://explorer.solana.com';
const EMPTY_PARAMS = Promise.resolve({});

function requestFactory(uri?: string): {
    nextParams: { params: Promise<{ network: string }> };
    request: Request;
} {
    const params = new URLSearchParams({ uri: uri ?? '' });
    const request = new Request(`${ORIGIN}/api/metadata/devnet?${params.toString()}`);
    const nextParams = { params: Promise.resolve({ network: 'devnet' }) };

    return { nextParams, request };
}

describe('Metadata Proxy Route', () => {
    const validUrl = encodeURIComponent('http://external.resource/file.json');
    const unsupportedUri = encodeURIComponent('ftp://unsupported.resource/file.json');

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should return status when disabled', async () => {
        setEnvironment('NEXT_PUBLIC_METADATA_ENABLED', 'false');

        const { request, nextParams } = requestFactory();
        const response = await GET(request, nextParams);
        expect(response.status).toBe(404);
    });

    it('should return 400 for URIs with unsupported protocols', async () => {
        setEnvironment('NEXT_PUBLIC_METADATA_ENABLED', 'true');

        const request = requestFactory(unsupportedUri);
        const response = await GET(request.request, request.nextParams);
        expect(response.status).toBe(400);
    });

    it('should return proper status upon processing data', async () => {
        setEnvironment('NEXT_PUBLIC_METADATA_ENABLED', 'true');

        const { request, nextParams } = requestFactory();
        const response = await GET(request, nextParams);
        expect(response.status).toBe(400);

        // fail on encoded incorrectly input
        const request2 = requestFactory('https://example.com/%E0%A4%A');
        expect((await GET(request2.request, request2.nextParams)).status).toBe(400);

        // fail due to unexpected error
        const request3 = requestFactory(validUrl);
        const result = await GET(request3.request, request3.nextParams);
        expect(result.status).toBe(403);
    });

    it('should handle valid response successfully', async () => {
        mockFileResponseOnce(
            { attributes: [], name: 'NFT' },
            {
                'Cache-Control': 'no-cache',
                'Content-Length': '140',
                'Content-Type': 'application/json',
                Etag: 'random-etag',
            },
        );
        // @ts-expect-error lookup does not have mocked fn
        dns.lookup.mockResolvedValueOnce([{ address: '8.8.8.8' }]);

        const request = requestFactory(validUrl);
        expect((await GET(request.request, request.nextParams)).status).toBe(200);
    });
});

describe('Metadata Proxy Route :: resource fetching', () => {
    const testUri = 'http://google.com/metadata.json';
    const testData = { description: 'Test Description', name: 'Test NFT' };

    beforeEach(() => {
        process.env.NEXT_PUBLIC_METADATA_ENABLED = 'true';
    });

    it('should handle response without Content-Length header', async () => {
        const sourceHeaders = {
            'Cache-Control': 'max-age=3600',
            'Content-Type': 'application/json',
            ETag: 'test-etag',
        };

        // @ts-expect-error lookup does not have mocked fn
        dns.lookup.mockResolvedValueOnce([{ address: '8.8.8.8' }]);

        fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(testData), { headers: sourceHeaders }));

        const request = new Request(`http://localhost:3000/api/metadata/proxy?uri=${encodeURIComponent(testUri)}`);
        const response = await GET(request, { params: EMPTY_PARAMS });

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('application/json');
        expect(response.headers.get('cache-control')).toBe('max-age=3600');
        expect(response.headers.get('etag')).toBe('test-etag');

        // Content-Length should not be forwarded by the proxy.
        const contentLength = response.headers.get('content-length');
        expect(contentLength).toBeNull();
    });
});
