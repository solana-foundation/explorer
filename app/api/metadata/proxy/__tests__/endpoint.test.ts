import _dns from 'dns';
import fetch, { Headers } from 'node-fetch';
import { vi } from 'vitest';

import { GET } from '../route';

const dns = _dns.promises;

function setEnvironment(key: string, value: string) {
    Object.assign(process.env, { ...process.env, [key]: value });
}

vi.mock('node-fetch', async () => {
    const actual = await vi.importActual('node-fetch');
    return {
        ...actual,
        default: vi.fn()
    };
});

vi.mock('dns', async () => {
    const originalDns = await vi.importActual('dns');
    const lookupFn = vi.fn();
    return {
        ...originalDns,
        default: {
            promises: {
                lookup: lookupFn,
            }
        },
        promises: {
            lookup: lookupFn,
        }
    };
});

async function mockFileResponseOnce(data: any, headers: Headers) {
    // @ts-expect-error unavailable mock method for fetch
    fetch.mockResolvedValueOnce({ headers, json: async () => data });
}

const ORIGIN = 'http://explorer.solana.com';

function requestFactory(uri?: string) {
    const params = new URLSearchParams({ uri: uri ?? '' });
    const request = new Request(`${ORIGIN}/api/metadata/devnet?${params.toString()}`);
    const nextParams = { params: { network: 'devnet' } };

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
        await mockFileResponseOnce({ attributes: [], name: "NFT" }, new Headers({
            'Cache-Control': 'no-cache',
            'Content-Length': '140',
            'Content-Type': 'application/json',
            'Etag': 'random-etag',
        }));
        // @ts-expect-error lookup does not have mocked fn
        dns.lookup.mockResolvedValueOnce([{ address: '8.8.8.8' }]);

        const request = requestFactory(validUrl);
        expect((await GET(request.request, request.nextParams)).status).toBe(200);
    });
});

describe('Metadata Proxy Route :: resource fetching', () => {
    const testUri = 'http://google.com/metadata.json';
    const testData = { description: "Test Description", name: "Test NFT" };

    beforeEach(() => {
        process.env.NEXT_PUBLIC_METADATA_ENABLED = 'true';
    });

    it('should handle response without Content-Length header', async () => {
        const sourceHeaders = new Headers({
            'Cache-Control': 'max-age=3600',
            'Content-Type': 'application/json',
            'ETag': 'test-etag',
        });

        // @ts-expect-error lookup does not have mocked fn
        dns.lookup.mockResolvedValueOnce([{ address: '8.8.8.8' }]);

        // Mock fetch to return a response without Content-Length
        // @ts-expect-error fetch does not have mocked fn
        fetch.mockResolvedValueOnce({
            arrayBuffer: async () => new ArrayBuffer(8),
            headers: sourceHeaders,
            json: async () => testData
        });

        const request = new Request(`http://localhost:3000/api/metadata/proxy?uri=${encodeURIComponent(testUri)}`);
        const response = await GET(request, { params: {} });

        // Verify response
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('application/json');
        expect(response.headers.get('cache-control')).toBe('max-age=3600');
        expect(response.headers.get('etag')).toBe('test-etag');

        // Next.js should calculate and set Content-Length automatically in theory
        const contentLength = response.headers.get('content-length');
        expect(contentLength).toBeNull();
    });

    it('should preserve original Content-Length header when present', async () => {
        const originalContentLength = '89'; // Length of testData JSON, but different from real one
        const sourceHeaders = new Headers({
            'Cache-Control': 'max-age=3600',
            'Content-Length': originalContentLength,
            'Content-Type': 'application/json',
            'ETag': 'test-etag',
        });

        // @ts-expect-error lookup does not have mocked fn
        dns.lookup.mockResolvedValueOnce([{ address: '8.8.8.8' }]);

        // Mock fetch to return a response with Content-Length
        // @ts-expect-error fetch does not have mocked fn
        fetch.mockResolvedValueOnce({
            arrayBuffer: async () => new ArrayBuffer(8),
            headers: sourceHeaders,
            json: async () => testData
        });

        const request = new Request(`http://localhost:3000/api/metadata/proxy?uri=${encodeURIComponent(testUri)}`);
        const response = await GET(request, { params: {} });

        // Verify response
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('application/json');
        expect(response.headers.get('cache-control')).toBe('max-age=3600');
        expect(response.headers.get('etag')).toBe('test-etag');

        // Content-Length should match original
        expect(response.headers.get('content-length')).toBe(originalContentLength);
    });
});