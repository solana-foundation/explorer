/**
 * @jest-environment node
 */
import fetch, { Headers } from 'node-fetch';
import { GET } from '../route';

function setEnvironment(key: string, value: string) {
    Object.assign(process.env, { ...process.env, [key]: value });
}

jest.mock('node-fetch', () => {
    const originalFetch = jest.requireActual('node-fetch')
    const mockFn = jest.fn();

    Object.assign(mockFn, originalFetch);

    return mockFn
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
    const validUrl = encodeURI('http://external.resource/file.json');

    afterEach(() => {
        jest.clearAllMocks();
    })

    it('should return status when disabled', async () => {
        setEnvironment('NEXT_PUBLIC_METADATA_ENABLED', 'false');

        const { request, nextParams } = requestFactory();
        const response = await GET(request, nextParams);
        expect(response.status).toBe(404);
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
        expect(result.status).toBe(500);
    });

    it('should handle valid response successfully', async () => {
        await mockFileResponseOnce({ name: "NFT", attributes: [] }, new Headers({
            'Cache-Control': 'no-cache',
            'Content-Length': '140',
            'Content-Type': 'application/json',
            'Etag': 'random-etag',
        }));

        const request = requestFactory(validUrl);
        expect((await GET(request.request, request.nextParams)).status).toBe(200);
    })
});
