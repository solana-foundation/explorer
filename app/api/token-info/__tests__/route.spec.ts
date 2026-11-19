import { gen } from '@__fixtures__/gen';
import { GENESIS_HASHES } from '@entities/chain-id/lib/const';
import { resolved, tokenInfo } from '@entities/token-info/__fixtures__/token-info';
import { lookupTokenInfos, TOKEN_INFO_REQUEST_LIMIT } from '@entities/token-info/server';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '../route';

const MINT_A = gen.address(1);
const MINT_B = gen.address(2);

const ROUTE_URL = 'http://localhost:3000/api/token-info';

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

describe('POST /api/token-info', () => {
    it('should return the token info of the lookup', async () => {
        vi.mocked(lookupTokenInfos).mockResolvedValue(resolved(tokenInfo(MINT_A)));

        const response = await post({ addresses: [MINT_A], cluster: Cluster.Mainnet });

        expect(await response.json()).toEqual({ content: [tokenInfo(MINT_A)] });
    });

    it.each([
        [
            'each address once, when the repeats exceed the cap',
            { addresses: [...Array(TOKEN_INFO_REQUEST_LIMIT + 1).fill(MINT_A), MINT_B], cluster: Cluster.Mainnet },
            { addresses: [MINT_A, MINT_B], cluster: Cluster.Mainnet },
        ],
        [
            'with the genesis hash of a Custom cluster',
            { addresses: [MINT_A], cluster: Cluster.Custom, genesisHash: GENESIS_HASHES.MAINNET },
            { addresses: [MINT_A], cluster: Cluster.Custom, genesisHash: GENESIS_HASHES.MAINNET },
        ],
        [
            'with the on-chain fallback when the caller opts in',
            { addresses: [MINT_A], cluster: Cluster.Mainnet, includeOnChainFallback: true },
            { addresses: [MINT_A], cluster: Cluster.Mainnet, includeOnChainFallback: true },
        ],
        [
            'and ignore a key it does not know',
            { addresses: [MINT_A], cluster: Cluster.Mainnet, verbose: true },
            { addresses: [MINT_A], cluster: Cluster.Mainnet },
        ],
    ])('should look up %s', async (_, body, lookup) => {
        const response = await post(body);

        expect(response.status).toBe(200);
        expect(lookupTokenInfos).toHaveBeenCalledWith({
            genesisHash: undefined,
            includeOnChainFallback: false,
            ...lookup,
        });
    });

    it('should return 400 without a lookup for a body that is not JSON', async () => {
        const response = await POST(new Request(ROUTE_URL, { body: 'nope', method: 'POST' }));

        expect(response.status).toBe(400);
        expect(lookupTokenInfos).not.toHaveBeenCalled();
    });

    it.each([
        ['a body without addresses', { cluster: Cluster.Mainnet }],
        ['a malformed address', { addresses: [MINT_A, 'not-a-pubkey'], cluster: Cluster.Mainnet }],
        ['an unsupported cluster', { addresses: [MINT_A], cluster: 999 }],
        ['a cluster that is not a number', { addresses: [MINT_A], cluster: '0' }],
        ['a genesis hash that is not a string', { addresses: [MINT_A], cluster: Cluster.Custom, genesisHash: 42 }],
        [
            'more distinct addresses than the cap',
            {
                addresses: Array.from({ length: TOKEN_INFO_REQUEST_LIMIT + 1 }, (_, index) => gen.address(index)),
                cluster: Cluster.Mainnet,
            },
        ],
    ])('should return 400 without a lookup for %s', async (_, body) => {
        const response = await post(body);

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'Invalid request' });
        expect(lookupTokenInfos).not.toHaveBeenCalled();
    });

    it('should answer an empty list without a lookup for no addresses', async () => {
        const response = await post({ addresses: [], cluster: Cluster.Mainnet });

        expect(await response.json()).toEqual({ content: [] });
        expect(lookupTokenInfos).not.toHaveBeenCalled();
    });
});

function post(body: unknown): Promise<Response> {
    return POST(new Request(ROUTE_URL, { body: JSON.stringify(body), method: 'POST' }));
}
