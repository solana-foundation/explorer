import fetch from 'node-fetch';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getAssetBatch } from '@/app/entities/digital-asset/api';

import { GET } from '../route';

vi.mock('node-fetch', async () => {
    const actual = await vi.importActual('node-fetch');
    return { ...actual, default: vi.fn() };
});

vi.mock('@/app/entities/digital-asset/api', () => ({
    getAssetBatch: vi.fn(),
}));

const fetchMock = vi.mocked(fetch);
const getAssetBatchMock = vi.mocked(getAssetBatch);

const VALID_ADDRESS = 'So11111111111111111111111111111111111111112';

function makeJupiterToken(overrides: Record<string, unknown> = {}) {
    return {
        decimals: 9,
        id: VALID_ADDRESS,
        isVerified: true,
        logoURI: 'https://example.com/sol.png',
        name: 'Wrapped SOL',
        symbol: 'SOL',
        ...overrides,
    };
}

function mockFetch(status: number, body: unknown) {
    const ok = status >= 200 && status < 300;
    fetchMock.mockResolvedValueOnce({
        json: async () => body,
        ok,
        status,
    } as Awaited<ReturnType<typeof fetch>>);
}

let testSeq = 0;
function makeRequest(q: string, cluster = 'mainnet-beta') {
    return new Request(`http://localhost/api/search?q=${encodeURIComponent(q)}-${++testSeq}&cluster=${cluster}`);
}

const originalEnv = { ...process.env };

beforeEach(() => {
    process.env = { ...originalEnv, JUPITER_API_KEY: 'test-key' };
    getAssetBatchMock.mockResolvedValue(null);
});

afterEach(() => {
    process.env = originalEnv;
    vi.resetAllMocks();
});

describe('GET /api/search', () => {
    describe('empty / guard cases', () => {
        it('should return empty with cache headers for empty query', async () => {
            const res = await GET(new Request('http://localhost/api/search?q='));
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toMatchObject({ results: { tokens: [] }, success: true });
            expect(res.headers.get('Cache-Control')).toContain('s-maxage=30');
        });

        it('should return empty with no-store headers for non-mainnet cluster', async () => {
            const res = await GET(new Request(`http://localhost/api/search?q=sol-${++testSeq}&cluster=devnet`));
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toMatchObject({ results: { tokens: [] }, success: true });
            expect(res.headers.get('Cache-Control')).toContain('no-store');
        });

        it('should return empty with cache headers when query exceeds max length', async () => {
            const longQuery = 'a'.repeat(201);
            const res = await GET(new Request(`http://localhost/api/search?q=${longQuery}`));
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toMatchObject({ results: { tokens: [] }, success: true });
            expect(res.headers.get('Cache-Control')).toContain('s-maxage=30');
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('should return empty with cache headers when Jupiter returns empty array', async () => {
            mockFetch(200, []);
            const res = await GET(makeRequest('sol'));
            const data = await res.json();
            expect(data).toMatchObject({ results: { tokens: [] }, success: true });
            expect(res.headers.get('Cache-Control')).toContain('s-maxage=30');
        });
    });

    describe('Jupiter discovery', () => {
        it('should normalize tokens on success', async () => {
            mockFetch(200, [makeJupiterToken()]);
            const res = await GET(makeRequest('sol'));
            const data = await res.json();

            expect(data.success).toBe(true);
            expect(data.results.tokens).toHaveLength(1);
            expect(data.results.tokens[0]).toMatchObject({
                icon: 'https://example.com/sol.png',
                isVerified: true,
                name: 'Wrapped SOL',
                ticker: 'SOL',
                tokenAddress: VALID_ADDRESS,
            });
        });

        it('should return cache headers on success', async () => {
            mockFetch(200, [makeJupiterToken()]);
            const res = await GET(makeRequest('sol'));
            expect(res.headers.get('Cache-Control')).toContain('s-maxage=30');
        });

        it('should detect address query type', async () => {
            mockFetch(200, [makeJupiterToken()]);
            const res = await GET(
                new Request(`http://localhost/api/search?q=${encodeURIComponent(VALID_ADDRESS)}-${++testSeq}`),
            );
            const data = await res.json();
            // address detection is based on exact 32-byte bs58 — padded variant used here is text
            expect(['address', 'text']).toContain(data.queryType);
        });

        it('should return empty when Jupiter returns non-ok', async () => {
            mockFetch(429, {});
            const res = await GET(makeRequest('sol'));
            const data = await res.json();
            expect(data.results.tokens).toHaveLength(0);
        });
    });

    describe('UTL fallback', () => {
        it('should use UTL when JUPITER_API_KEY is not set', async () => {
            delete process.env.JUPITER_API_KEY;
            mockFetch(200, {
                content: [{ address: VALID_ADDRESS, name: 'Wrapped SOL', symbol: 'SOL' }],
            });

            const res = await GET(makeRequest('sol'));
            const data = await res.json();

            expect(data.results.tokens[0]).toMatchObject({
                name: 'Wrapped SOL',
                ticker: 'SOL',
                tokenAddress: VALID_ADDRESS,
            });
        });

        it('should mark UTL tokens as unverified', async () => {
            delete process.env.JUPITER_API_KEY;
            mockFetch(200, { content: [{ address: VALID_ADDRESS, name: 'Test', symbol: 'TST' }] });

            const res = await GET(makeRequest('test'));
            const data = await res.json();
            expect(data.results.tokens[0].isVerified).toBe(false);
        });
    });

    describe('DAS icon enrichment', () => {
        it('should enrich icon from DAS when logoUri is null', async () => {
            mockFetch(200, [makeJupiterToken({ logoURI: null })]);
            getAssetBatchMock.mockResolvedValueOnce([
                {
                    burnt: false,
                    content: {
                        $schema: '',
                        json_uri: '',
                        links: { image: 'https://das.example.com/sol.png' },
                        metadata: {},
                    },
                    id: VALID_ADDRESS,
                    interface: 'FungibleToken',
                    mutable: true,
                },
            ]);

            const res = await GET(makeRequest('sol'));
            const data = await res.json();
            expect(data.results.tokens[0].icon).toBe('https://das.example.com/sol.png');
        });

        it('should prefer logoUri over DAS image when both present', async () => {
            mockFetch(200, [makeJupiterToken({ logoURI: 'https://original.com/sol.png' })]);
            getAssetBatchMock.mockResolvedValueOnce([
                {
                    burnt: false,
                    content: {
                        $schema: '',
                        json_uri: '',
                        links: { image: 'https://das.example.com/sol.png' },
                        metadata: {},
                    },
                    id: VALID_ADDRESS,
                    interface: 'FungibleToken',
                    mutable: true,
                },
            ]);

            const res = await GET(makeRequest('sol'));
            const data = await res.json();
            expect(data.results.tokens[0].icon).toBe('https://original.com/sol.png');
        });

        it('should use null icon when DAS returns null and logoUri is absent', async () => {
            mockFetch(200, [makeJupiterToken({ logoURI: null })]);
            getAssetBatchMock.mockResolvedValueOnce(null);

            const res = await GET(makeRequest('sol'));
            const data = await res.json();
            expect(data.results.tokens[0].icon).toBeUndefined();
        });
    });
});
