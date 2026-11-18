import { gen } from '@__fixtures__/gen';
import { GENESIS_HASHES } from '@entities/chain-id/lib/const';
import { tokenInfo } from '@entities/token-info/__fixtures__/token-info';
import { JUPITER_ROUTE_TIMEOUT_MS } from '@entities/token-info/api/lookup-token-info';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TokenInfo } from '@/app/entities/token-info/server';
import { CACHE_HEADERS, ERROR_CACHE_HEADERS } from '@/app/shared/lib/http-utils';
import { Cluster } from '@/app/utils/cluster';

import { GET, maxDuration } from '../route';

const MINT = gen.address(1);

const mocks = vi.hoisted(() => ({ lookupTokenInfos: vi.fn() }));

vi.mock('@entities/token-info/server', async () => {
    const actual = await vi.importActual<typeof import('@entities/token-info/server')>('@entities/token-info/server');
    return { ...actual, lookupTokenInfos: mocks.lookupTokenInfos };
});

describe('GET /api/token-info/[mintAddress]', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.lookupTokenInfos.mockResolvedValue(resolved([]));
    });

    it.each([
        ['the mint is not an address', 'not-a-pubkey', 'cluster=0'],
        ['a Custom cluster has no genesis hash', MINT, `cluster=${Cluster.Custom}`],
    ])('should return 400 without a cache header when %s', async (_, mintAddress, query) => {
        const response = await get(query, mintAddress);

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'Invalid request' });
        expect(response.headers.get('Cache-Control')).toBeNull();
        expect(mocks.lookupTokenInfos).not.toHaveBeenCalled();
    });

    it('should return a listed mint with cache headers', async () => {
        mocks.lookupTokenInfos.mockResolvedValueOnce(resolved([tokenInfo(MINT, true)]));

        const response = await get(`cluster=${Cluster.Mainnet}`);

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ content: [tokenInfo(MINT, true)] });
        expect(response.headers.get('Cache-Control')).toBe(CACHE_HEADERS['Cache-Control']);
        expect(mocks.lookupTokenInfos).toHaveBeenCalledWith({
            addresses: [MINT],
            cluster: Cluster.Mainnet,
            genesisHash: undefined,
        });
    });

    it('should return an empty list with cache headers for a mint Jupiter does not list', async () => {
        const response = await get(`cluster=${Cluster.Mainnet}`);

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ content: [] });
        expect(response.headers.get('Cache-Control')).toBe(CACHE_HEADERS['Cache-Control']);
    });

    it('should forward the genesis hash of a Custom cluster', async () => {
        const response = await get(`cluster=${Cluster.Custom}&genesisHash=${GENESIS_HASHES.MAINNET}`);

        expect(response.status).toBe(200);
        expect(mocks.lookupTokenInfos).toHaveBeenCalledWith({
            addresses: [MINT],
            cluster: Cluster.Custom,
            genesisHash: GENESIS_HASHES.MAINNET,
        });
    });

    it('should answer a failed lookup with the error cache headers', async () => {
        mocks.lookupTokenInfos.mockResolvedValue({ kind: 'unavailable' });

        const response = await get(`cluster=${Cluster.Mainnet}`);

        expect(response.headers.get('Cache-Control')).toBe(ERROR_CACHE_HEADERS['Cache-Control']);
    });

    it('should keep the function duration under the browser timeout', () => {
        expect(maxDuration * 1000).toBeLessThan(JUPITER_ROUTE_TIMEOUT_MS);
    });
});

function resolved(tokens: TokenInfo[]) {
    return { kind: 'resolved', tokens };
}

async function get(query: string, mintAddress: string = MINT) {
    const request = new Request(`http://localhost:3000/api/token-info/${mintAddress}?${query}`);
    return await GET(request, { params: Promise.resolve({ mintAddress }) });
}
