import { gen } from '@__fixtures__/gen';
import { GENESIS_HASHES } from '@entities/chain-id/lib/const';
import { tokenInfo } from '@entities/token-info/__fixtures__/token-info';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TokenInfoHttpError } from '@/app/entities/token-info';
import type { TokenInfo } from '@/app/entities/token-info/server';
import { CACHE_HEADERS, ERROR_CACHE_HEADERS } from '@/app/shared/lib/http-utils';
import { Cluster } from '@/app/utils/cluster';

import { GET } from '../route';

const MINT = gen.address(1);

const mocks = vi.hoisted(() => ({
    getTokenInfos: vi.fn(),
    getTokenInfosFromMetaplex: vi.fn(),
}));

vi.mock('@entities/token-info/server', async () => {
    const actual = await vi.importActual<typeof import('@entities/token-info/server')>('@entities/token-info/server');
    return {
        ...actual,
        getTokenInfos: mocks.getTokenInfos,
        getTokenInfosFromMetaplex: mocks.getTokenInfosFromMetaplex,
    };
});

describe('GET /api/token-info/[mintAddress]', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getTokenInfos.mockResolvedValue(resolved([]));
        mocks.getTokenInfosFromMetaplex.mockResolvedValue([tokenInfo(MINT)]);
    });

    describe('validation', () => {
        it.each([
            ['the mint is not an address', 'not-a-pubkey', 'cluster=0'],
            ['the cluster is missing', MINT, ''],
            ['the cluster is empty', MINT, 'cluster='],
            ['the cluster is not a number', MINT, 'cluster=mainnet'],
            ['the cluster is not an integer', MINT, 'cluster=1.5'],
            ['the cluster is not supported', MINT, 'cluster=999'],
            ['a Custom cluster has no genesis hash', MINT, `cluster=${Cluster.Custom}`],
            ['a Custom cluster has an unknown genesis hash', MINT, `cluster=${Cluster.Custom}&genesisHash=unknown`],
        ])('should return 400 without a cache header when %s', async (_, mintAddress, query) => {
            const response = await get(query, mintAddress);

            expect(response.status).toBe(400);
            expect(await response.json()).toEqual({ error: 'Invalid request' });
            expect(response.headers.get('Cache-Control')).toBeNull();
            expect(mocks.getTokenInfos).not.toHaveBeenCalled();
        });
    });

    describe('successful response', () => {
        it('should return a listed mint with cache headers', async () => {
            mocks.getTokenInfos.mockResolvedValueOnce(resolved([tokenInfo(MINT, true)]));

            const response = await get(`cluster=${Cluster.MainnetBeta}`);

            expect(response.status).toBe(200);
            expect(await response.json()).toEqual({ content: [tokenInfo(MINT, true)] });
            expect(response.headers.get('Cache-Control')).toBe(CACHE_HEADERS['Cache-Control']);
            expect(mocks.getTokenInfos).toHaveBeenCalledWith(
                [MINT],
                Cluster.MainnetBeta,
                undefined,
                expect.objectContaining({ signal: expect.any(AbortSignal) }),
            );
        });

        it('should return an empty list with cache headers for a mint Jupiter does not list', async () => {
            const response = await get(`cluster=${Cluster.MainnetBeta}`);

            expect(response.status).toBe(200);
            expect(await response.json()).toEqual({ content: [] });
            expect(response.headers.get('Cache-Control')).toBe(CACHE_HEADERS['Cache-Control']);
        });

        it('should forward the genesis hash of a Custom cluster', async () => {
            const response = await get(`cluster=${Cluster.Custom}&genesisHash=${GENESIS_HASHES.MAINNET}`);

            expect(response.status).toBe(200);
            expect(mocks.getTokenInfos).toHaveBeenCalledWith(
                [MINT],
                Cluster.Custom,
                GENESIS_HASHES.MAINNET,
                expect.anything(),
            );
        });

        it('should not run the on-chain fallback when the query asks for it', async () => {
            const response = await get(`cluster=${Cluster.MainnetBeta}&includeOnChainFallback=true`);

            expect(response.status).toBe(200);
            expect(await response.json()).toEqual({ content: [] });
            expect(mocks.getTokenInfosFromMetaplex).not.toHaveBeenCalled();
        });
    });

    describe('a redacted mint', () => {
        beforeEach(async () => {
            const actual =
                await vi.importActual<typeof import('@entities/token-info/server')>('@entities/token-info/server');
            mocks.getTokenInfos.mockImplementation(actual.getTokenInfos);
            vi.stubEnv('JUPITER_API_KEY', 'test-key');
            vi.stubEnv('NEXT_PUBLIC_BAD_TOKENS', MINT);
            vi.stubGlobal('fetch', vi.fn());
        });

        afterEach(() => {
            vi.unstubAllEnvs();
            vi.unstubAllGlobals();
        });

        it('should return an empty list without a Jupiter request', async () => {
            const response = await get(`cluster=${Cluster.MainnetBeta}`);

            expect(response.status).toBe(200);
            expect(await response.json()).toEqual({ content: [] });
            expect(fetch).not.toHaveBeenCalled();
        });
    });

    describe('Jupiter errors', () => {
        it('should return 429 with error cache headers when Jupiter is rate limited', async () => {
            failUpstream(new TokenInfoHttpError({ status: 429, statusText: 'Too Many Requests' }));

            const response = await get(`cluster=${Cluster.MainnetBeta}`);

            expect(response.status).toBe(429);
            expect(await response.json()).toEqual({ error: 'Token info rate limited' });
            expect(response.headers.get('Cache-Control')).toBe(ERROR_CACHE_HEADERS['Cache-Control']);
        });

        it('should return 503 with error cache headers when Jupiter is unavailable', async () => {
            failUpstream(new TokenInfoHttpError({ status: 500, statusText: 'Internal Server Error' }));

            const response = await get(`cluster=${Cluster.MainnetBeta}`);

            expect(response.status).toBe(503);
            expect(await response.json()).toEqual({ error: 'Token info unavailable' });
            expect(response.headers.get('Cache-Control')).toBe(ERROR_CACHE_HEADERS['Cache-Control']);
        });
    });
});

function resolved(tokens: TokenInfo[]) {
    return { kind: 'resolved', malformed: 0, tokens };
}

function failUpstream(error: unknown) {
    mocks.getTokenInfos.mockResolvedValue({ error, kind: 'unavailable' });
}

async function get(query: string, mintAddress: string = MINT) {
    const request = new Request(`http://localhost:3000/api/token-info/${mintAddress}?${query}`);
    return await GET(request, { params: Promise.resolve({ mintAddress }) });
}
