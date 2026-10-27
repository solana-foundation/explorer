import { gen } from '@__fixtures__/gen';
import { describe, expect, it, vi } from 'vitest';

import { tokenInfo } from '@/app/entities/token-info/__fixtures__/token-info';
import { getTokenInfo } from '@/app/entities/token-info/server';
import { Cluster, CLUSTERS, clusterSlug } from '@/app/utils/cluster';
import getReadableTitleFromAddress from '@/app/utils/get-readable-title-from-address';

vi.mock('@/app/entities/token-info/server', () => ({
    getTokenInfo: vi.fn(() => undefined),
}));

describe('getReadableTitleFromAddress', () => {
    it.each(CLUSTERS)('should look the token up on the cluster the slug names (%i)', async cluster => {
        await getReadableTitleFromAddress(props(clusterSlug(cluster)));

        expect(getTokenInfo).toHaveBeenCalledWith(TOKEN_ADDRESS, cluster);
    });

    it.each([undefined, 'not-a-cluster'])('should fall back to the default cluster for %s', async clusterParam => {
        await getReadableTitleFromAddress(props(clusterParam));

        expect(getTokenInfo).toHaveBeenCalledWith(TOKEN_ADDRESS, Cluster.MainnetBeta);
    });

    it('should return the bare address when the address is not a token', async () => {
        expect(await getReadableTitleFromAddress(props(clusterSlug(Cluster.Devnet)))).toBe(TOKEN_ADDRESS);
    });

    it('should title a token with its name and a truncated address', async () => {
        vi.mocked(getTokenInfo).mockResolvedValueOnce(tokenInfo(TOKEN_ADDRESS, undefined, { name: 'Wrapped SOL' }));

        expect(await getReadableTitleFromAddress(props())).toBe('Token | Wrapped SOL (TK…11)');
    });
});

function props(cluster?: string) {
    return {
        params: Promise.resolve({ address: TOKEN_ADDRESS }),
        searchParams: Promise.resolve(cluster === undefined ? {} : { cluster }),
    };
}

// A vanity address, so the truncated title asserts a literal `TK…11` instead of recomputing
// production's slicing.
const TOKEN_ADDRESS = gen.vanityAddress('TKN');
