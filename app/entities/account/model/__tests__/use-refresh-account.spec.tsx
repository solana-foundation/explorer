import { PublicKey } from '@solana/web3.js';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { getFullTokenInfoSwrKey } from '@utils/token-info';
import { SWRConfig } from 'swr';
import useSWRImmutable from 'swr/immutable';
import { describe, expect, it, vi } from 'vitest';

import { useRefreshAccount } from '../use-refresh-account';

const MOCK_URL = 'https://api.mainnet-beta.solana.com';
const MOCK_GENESIS_HASH = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d';

vi.mock('@providers/accounts', () => ({ useFetchAccountInfo: () => vi.fn() }));
vi.mock('@providers/cluster', () => ({
    useCluster: () => ({ cluster: Cluster.Custom, genesisHash: MOCK_GENESIS_HASH, url: MOCK_URL }),
}));

describe('useRefreshAccount', () => {
    it('should refetch the full token info of the account', async () => {
        const fetchFullTokenInfo = vi.fn(async () => null);
        const { result } = renderHook(
            () => {
                useSWRImmutable(
                    getFullTokenInfoSwrKey(MINT.toBase58(), Cluster.Custom, MOCK_URL, MOCK_GENESIS_HASH),
                    fetchFullTokenInfo,
                );
                return useRefreshAccount();
            },
            { wrapper },
        );
        await waitFor(() => expect(fetchFullTokenInfo).toHaveBeenCalledTimes(1));

        act(() => result.current(MINT, 'parsed'));

        await waitFor(() => expect(fetchFullTokenInfo).toHaveBeenCalledTimes(2));
    });
});

const MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

function wrapper({ children }: { children: React.ReactNode }) {
    return <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>;
}
