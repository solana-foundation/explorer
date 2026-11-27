import { gen } from '@__fixtures__/gen';
import { GENESIS_HASHES } from '@entities/chain-id/lib/const';
import { resolved, tokenInfo } from '@entities/token-info/__fixtures__/token-info';
import { JUPITER_ROUTE_TIMEOUT_MS } from '@entities/token-info/api/lookup-token-info';
import { lookupTokenInfos } from '@entities/token-info/server';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CACHE_HEADERS, ERROR_CACHE_HEADERS } from '@/app/shared/lib/http-utils';

import { GET, maxDuration } from '../route';

const MINT = gen.address(1);

vi.mock('@entities/token-info/server', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/token-info/server')>()),
    lookupTokenInfos: vi.fn(),
}));

beforeEach(() => {
    vi.mocked(lookupTokenInfos).mockResolvedValue(resolved());
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('GET /api/token-info/[mintAddress]', () => {
    it('should return the lookup of the mint with the cache headers', async () => {
        vi.mocked(lookupTokenInfos).mockResolvedValue(resolved(tokenInfo(MINT, true)));

        const response = await get(`cluster=${Cluster.Mainnet}`);

        expect(await response.json()).toEqual({ content: [tokenInfo(MINT, true)] });
        expect(response.headers.get('Cache-Control')).toBe(CACHE_HEADERS['Cache-Control']);
    });

    it('should answer a failed lookup with the error cache headers', async () => {
        vi.mocked(lookupTokenInfos).mockResolvedValue({ kind: 'unavailable' });

        const response = await get(`cluster=${Cluster.Mainnet}`);

        expect(response.headers.get('Cache-Control')).toBe(ERROR_CACHE_HEADERS['Cache-Control']);
    });

    it.each([
        ['a named cluster', `cluster=${Cluster.Mainnet}`, { cluster: Cluster.Mainnet, genesisHash: undefined }],
        [
            'a Custom cluster with its genesis hash',
            `cluster=${Cluster.Custom}&genesisHash=${GENESIS_HASHES.MAINNET}`,
            { cluster: Cluster.Custom, genesisHash: GENESIS_HASHES.MAINNET },
        ],
    ])('should look up the mint on %s', async (_, query, request) => {
        await get(query);

        expect(lookupTokenInfos).toHaveBeenCalledWith({ addresses: [MINT], ...request });
    });

    it.each([
        ['the mint is not an address', 'not-a-pubkey', `cluster=${Cluster.Mainnet}`],
        ['a Custom cluster has no genesis hash', MINT, `cluster=${Cluster.Custom}`],
    ])('should return 400 without a cache header when %s', async (_, mintAddress, query) => {
        const response = await get(query, mintAddress);

        expect(response.status).toBe(400);
        expect(response.headers.get('Cache-Control')).toBeNull();
        expect(lookupTokenInfos).not.toHaveBeenCalled();
    });

    it('should keep the function duration under the browser timeout', () => {
        expect(maxDuration * 1000).toBeLessThan(JUPITER_ROUTE_TIMEOUT_MS);
    });
});

function get(query: string, mintAddress: string = MINT): Promise<Response> {
    const request = new Request(`http://localhost:3000/api/token-info/${mintAddress}?${query}`);
    return GET(request, { params: Promise.resolve({ mintAddress }) });
}
