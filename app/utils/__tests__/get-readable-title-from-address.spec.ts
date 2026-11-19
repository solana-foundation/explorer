import { gen } from '@__fixtures__/gen';
import { describe, expect, it, vi } from 'vitest';

import { lookupTokenInfo } from '@/app/entities/token-info/server';
import { Cluster, CLUSTERS, clusterSlug } from '@/app/utils/cluster';
import getReadableTitleFromAddress from '@/app/utils/get-readable-title-from-address';

vi.mock('@/app/entities/token-info/server', () => ({
    lookupTokenInfo: vi.fn(async () => ({ kind: 'not-listed' })),
}));

describe('getReadableTitleFromAddress', () => {
    it.each(CLUSTERS)('should look the token up on the cluster the slug names (%i)', async cluster => {
        await getReadableTitleFromAddress(props(clusterSlug(cluster)));

        expect(lookupTokenInfo).toHaveBeenCalledWith({ cluster, genesisHash: undefined, mint: TOKEN_ADDRESS });
    });

    it.each([undefined, 'not-a-cluster'])('should fall back to the default cluster for %s', async clusterParam => {
        await getReadableTitleFromAddress(props(clusterParam));

        expect(lookupTokenInfo).toHaveBeenCalledWith({
            cluster: Cluster.Mainnet,
            genesisHash: undefined,
            mint: TOKEN_ADDRESS,
        });
    });

    it.each(['not-listed', 'rate-limited', 'unavailable'] as const)(
        'should return the bare address when the lookup is %s',
        async kind => {
            vi.mocked(lookupTokenInfo).mockResolvedValueOnce({ kind });

            expect(await getReadableTitleFromAddress(props())).toBe(TOKEN_ADDRESS);
        },
    );

    it('should title a token with its name and a truncated address', async () => {
        vi.mocked(lookupTokenInfo).mockResolvedValueOnce({ kind: 'listed', token: tokenInfo('Wrapped SOL') });

        expect(await getReadableTitleFromAddress(props())).toBe('Token | Wrapped SOL (TK…11)');
    });

    it('should return the bare address for a redacted token', async () => {
        vi.mocked(lookupTokenInfo).mockResolvedValueOnce({
            kind: 'listed',
            token: { ...tokenInfo('Wrapped SOL'), name: undefined, symbol: undefined },
        });

        expect(await getReadableTitleFromAddress(props())).toBe(TOKEN_ADDRESS);
    });
});

function props(cluster?: string) {
    return {
        params: Promise.resolve({ address: TOKEN_ADDRESS }),
        searchParams: Promise.resolve(cluster === undefined ? {} : { cluster }),
    };
}

function tokenInfo(name: string) {
    return { address: TOKEN_ADDRESS, decimals: 9, name, symbol: 'SOL', verified: false };
}

// A vanity address, so the truncated title asserts a literal `TK…11` instead of recomputing
// production's slicing.
const TOKEN_ADDRESS = gen.vanityAddress('TKN');
