import { PublicKey } from '@solana/web3.js';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { getFullTokenInfoSwrKey } from '@utils/token-info';
import useSWRImmutable from 'swr/immutable';
import { describe, expect, it, vi } from 'vitest';

import { settleRetries, swrWrapper } from '@/app/__tests__/swr-hook';
import { accountRefreshKey } from '@/app/shared/lib/account-refresh-key';

import { rawAccountDataKey } from '../use-raw-account-data';
import { useRefreshAccount } from '../use-refresh-account';

const MOCK_URL = 'https://api.mainnet-beta.solana.com';
const MOCK_GENESIS_HASH = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d';

vi.mock('@providers/accounts', () => ({ useFetchAccountInfo: () => vi.fn() }));
vi.mock('@providers/cluster', () => ({
    useCluster: () => ({ cluster: Cluster.Custom, genesisHash: MOCK_GENESIS_HASH, url: MOCK_URL }),
}));

describe('useRefreshAccount', () => {
    it.each([
        ['full token info', getFullTokenInfoSwrKey(MINT.toBase58(), Cluster.Custom, MOCK_URL, MOCK_GENESIS_HASH)],
        ['raw account data', rawAccountDataKey(MOCK_URL, MINT.toBase58())],
    ])('should refetch the %s of the account', async (_, key) => {
        const fetcher = await refreshWith(key);

        await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    });

    it.each([
        ['a key outside the refresh keys', ['nftoken-collection-nfts', MOCK_URL, MINT.toBase58()]],
        ['a refresh key of another account', rawAccountDataKey(MOCK_URL, OTHER.toBase58())],
        [
            'a refresh key of another cluster',
            accountRefreshKey('https://api.devnet.solana.com', MINT.toBase58(), 'raw'),
        ],
    ])('should not refetch %s', async (_, key) => {
        const fetcher = await refreshWith(key);
        await act(() => settleRetries());

        expect(fetcher).toHaveBeenCalledTimes(1);
    });
});

async function refreshWith(key: readonly unknown[]) {
    const fetcher = vi.fn(async () => null);
    const { result } = renderHook(
        () => {
            useSWRImmutable(key, fetcher);
            return useRefreshAccount();
        },
        { wrapper: swrWrapper() },
    );
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    act(() => result.current(MINT, 'parsed'));
    return fetcher;
}

const MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const OTHER = new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
