/**
 * @jest-environment node
 */
import _dns from 'dns';
import fetch, { Headers } from 'node-fetch';

import { GET } from '../route';

const dns = _dns.promises;

function setEnvironment(key: string, value: string) {
    Object.assign(process.env, { ...process.env, [key]: value });
}

jest.mock('node-fetch', () => {
    const originalFetch = jest.requireActual('node-fetch')
    const mockFn = jest.fn();

    Object.assign(mockFn, originalFetch);

    return mockFn
});

jest.mock('dns', () => {
    const originalDns = jest.requireActual('dns');
    const lookupFn = jest.fn();
    return {
        ...originalDns,
        promises: {
            ...originalDns.promises,
            lookup: lookupFn,
        }
    };
});

async function mockFileResponseOnce(data: any, headers: Headers){
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

describe('metadata/[network] endpoint', () => {
    const validUrl = encodeURIComponent('http://external.resource/file.json');
    const unsupportedUri = encodeURIComponent('ftp://unsupported.resource/file.json');

    afterEach(() => {
        jest.clearAllMocks();
    })

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

    it('should return proper status upon processig data', async () => {
        setEnvironment('NEXT_PUBLIC_METADATA_ENABLED', 'true')

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
    })
});
