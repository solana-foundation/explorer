import { useRefreshAccount } from '@entities/account';
import { GENESIS_HASHES } from '@entities/chain-id';
import type { TokenInfo } from '@entities/token-info';
import type { Account } from '@providers/accounts';
import { type CacheEntry, FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Cluster, ClusterStatus } from '@utils/cluster';
import { useState } from 'react';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AddressLayout from '../layout';

const mock = vi.hoisted(() => ({
    entry: undefined as CacheEntry<Account> | undefined,
    lookupTokenInfo: vi.fn(),
}));

vi.mock('next/navigation');
vi.mock('@providers/accounts', async importOriginal => ({
    ...(await importOriginal<typeof import('@providers/accounts')>()),
    AccountsProvider: ({ children }: { children: React.ReactNode }) => children,
    useAccountInfo: (address: string) => (address === ADDRESS ? mock.entry : undefined),
    useFetchAccountInfo: () => vi.fn(),
}));
vi.mock('@providers/cluster', () => ({
    useCluster: () => ({
        cluster: Cluster.MainnetBeta,
        genesisHash: GENESIS_HASHES.MAINNET,
        status: ClusterStatus.Connected,
        url: 'https://api.mainnet-beta.solana.com',
    }),
}));
vi.mock('@entities/token-info/api/fetch-token-infos-from-api', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/token-info/api/fetch-token-infos-from-api')>()),
    lookupTokenInfo: mock.lookupTokenInfo,
}));
vi.mock('@/app/utils/url', async importOriginal => ({
    ...(await importOriginal<typeof import('@/app/utils/url')>()),
    useBuildClusterPath: () => (pathname: string) => pathname,
    useClusterPath: () => '/address',
}));
vi.mock('@/app/entities/feature-gate', async importOriginal => ({
    ...(await importOriginal<typeof import('@/app/entities/feature-gate')>()),
    useFeatureInfo: () => undefined,
}));
vi.mock('@/app/features/subscriptions', async importOriginal => ({
    ...(await importOriginal<typeof import('@/app/features/subscriptions')>()),
    useIsEventAuthority: () => false,
}));
vi.mock('@components/Header', () => ({
    Header: ({ isTokenInfoLoading, tokenInfo }: { isTokenInfoLoading: boolean; tokenInfo?: TokenInfo }) => (
        <h1>{isTokenInfoLoading ? 'header loading' : (tokenInfo?.name ?? 'header without token info')}</h1>
    ),
}));
vi.mock('@components/account/TokenAccountSection', () => ({ TokenAccountSection: () => null }));
vi.mock('@features/security-txt', () => ({ SecurityNotification: () => null }));
vi.mock('@/app/shared/ui/navigation-tabs', () => ({ NavigationTabLink: () => null, NavigationTabs: () => null }));

describe('AddressLayout', () => {
    beforeEach(() => {
        mock.entry = undefined;
        mock.lookupTokenInfo.mockReset();
        mock.lookupTokenInfo.mockResolvedValue({ kind: 'listed', token: TOKEN_INFO });
    });

    it('should keep the page mounted while a refresh fetches the account', async () => {
        mock.entry = { data: ACCOUNT, status: FetchStatus.Fetched };
        const { rerender } = render(page());
        await userEvent.click(await screen.findByRole('button', { name: 'clicks: 0' }));

        mock.entry = { data: ACCOUNT, status: FetchStatus.Fetching };
        rerender(page());

        expect(screen.getByRole('button', { name: 'clicks: 1' })).toBeInTheDocument();
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    it('should show the loading card while the account is fetching and has no data', async () => {
        mock.entry = { status: FetchStatus.Fetching };
        render(page());

        expect(await screen.findByText('Loading')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'clicks: 0' })).not.toBeInTheDocument();
    });

    it('should show the error card when the fetch fails without data', async () => {
        mock.entry = { status: FetchStatus.FetchFailed };
        render(page());

        expect(await screen.findByText('Fetch Failed')).toBeInTheDocument();
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    it('should show the loading card while the first token-info request runs', async () => {
        mock.lookupTokenInfo.mockReturnValueOnce(new Promise(() => {}));
        mock.entry = { data: ACCOUNT, status: FetchStatus.Fetched };
        render(page());

        expect(await screen.findByText('Loading')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'header loading' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'clicks: 0' })).not.toBeInTheDocument();
    });

    it('should keep the token info in the header while a refresh fetches the account', async () => {
        mock.entry = { data: ACCOUNT, status: FetchStatus.Fetched };
        const { rerender } = render(page());
        expect(await screen.findByRole('heading', { name: 'USD Coin' })).toBeInTheDocument();

        mock.entry = { data: ACCOUNT, status: FetchStatus.Fetching };
        rerender(page());

        expect(screen.getByRole('heading', { name: 'USD Coin' })).toBeInTheDocument();
    });

    it('should keep the page mounted while a refresh refetches a token without token info', async () => {
        mock.lookupTokenInfo.mockResolvedValueOnce({ kind: 'not-listed' }).mockReturnValueOnce(new Promise(() => {}));
        mock.entry = { data: ACCOUNT, status: FetchStatus.Fetched };
        const { rerender } = render(page());
        await userEvent.click(await screen.findByRole('button', { name: 'clicks: 0' }));

        await userEvent.click(screen.getByRole('button', { name: 'refresh' }));
        mock.entry = { data: ACCOUNT, status: FetchStatus.Fetching };
        rerender(page());

        await waitFor(() => expect(mock.lookupTokenInfo).toHaveBeenCalledTimes(2));
        expect(screen.getByRole('button', { name: 'clicks: 1' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'header without token info' })).toBeInTheDocument();
    });

    it('should keep the page mounted while a refresh refetches token info that failed to load', async () => {
        mock.lookupTokenInfo.mockResolvedValueOnce({ kind: 'unavailable' }).mockReturnValueOnce(new Promise(() => {}));
        mock.entry = { data: ACCOUNT, status: FetchStatus.Fetched };
        const { rerender } = render(page());
        await userEvent.click(await screen.findByRole('button', { name: 'clicks: 0' }));

        await userEvent.click(screen.getByRole('button', { name: 'refresh' }));
        mock.entry = { data: ACCOUNT, status: FetchStatus.Fetching };
        rerender(page());

        await waitFor(() => expect(mock.lookupTokenInfo).toHaveBeenCalledTimes(2));
        expect(screen.getByRole('button', { name: 'clicks: 1' })).toBeInTheDocument();
    });

    it('should keep the token info in the header when a refresh of it fails', async () => {
        mock.lookupTokenInfo
            .mockResolvedValueOnce({ kind: 'listed', token: TOKEN_INFO })
            .mockResolvedValueOnce({ kind: 'unavailable' });
        mock.entry = { data: ACCOUNT, status: FetchStatus.Fetched };
        render(page());
        expect(await screen.findByRole('heading', { name: 'USD Coin' })).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'refresh' }));

        await waitFor(() => expect(mock.lookupTokenInfo).toHaveBeenCalledTimes(2));
        expect(screen.getByRole('heading', { name: 'USD Coin' })).toBeInTheDocument();
    });

    it('should not retry a failed token-info request', async () => {
        mock.lookupTokenInfo.mockResolvedValueOnce({ kind: 'unavailable' });
        mock.entry = { data: ACCOUNT, status: FetchStatus.Fetched };
        render(page());
        expect(await screen.findByRole('heading', { name: 'header without token info' })).toBeInTheDocument();

        await act(() => new Promise(resolve => setTimeout(resolve, 100)));

        expect(mock.lookupTokenInfo).toHaveBeenCalledTimes(1);
    });

    it('should refetch failed token info when the page mounts again', async () => {
        mock.lookupTokenInfo.mockResolvedValueOnce({ kind: 'unavailable' });
        mock.entry = { data: ACCOUNT, status: FetchStatus.Fetched };
        const { rerender } = render(page());
        expect(await screen.findByRole('heading', { name: 'header without token info' })).toBeInTheDocument();

        rerender(page({ mounted: false }));
        rerender(page());

        expect(await screen.findByRole('heading', { name: 'USD Coin' })).toBeInTheDocument();
    });

    it('should not refetch missing token info when the page mounts again', async () => {
        mock.lookupTokenInfo.mockResolvedValueOnce({ kind: 'not-listed' });
        mock.entry = { data: ACCOUNT, status: FetchStatus.Fetched };
        const { rerender } = render(page());
        expect(await screen.findByRole('heading', { name: 'header without token info' })).toBeInTheDocument();

        rerender(page({ mounted: false }));
        rerender(page());
        await act(() => new Promise(resolve => setTimeout(resolve, 100)));

        expect(mock.lookupTokenInfo).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('heading', { name: 'header without token info' })).toBeInTheDocument();
    });
});

const ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const FULFILLED_PARAMS = Object.assign(Promise.resolve({ address: ADDRESS }), {
    status: 'fulfilled',
    value: { address: ADDRESS },
});

const ACCOUNT: Account = {
    data: {
        parsed: {
            parsed: {
                info: { decimals: 6, freezeAuthority: null, isInitialized: true, mintAuthority: null, supply: '1' },
                type: 'mint',
            },
            program: 'spl-token',
        },
    },
    executable: false,
    lamports: 1,
    owner: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    pubkey: new PublicKey(ADDRESS),
    space: 82,
};

const TOKEN_INFO: TokenInfo = {
    address: ADDRESS,
    decimals: 6,
    logoURI: null,
    name: 'USD Coin',
    symbol: 'USDC',
    verified: true,
};

function page({ mounted = true } = {}) {
    return (
        <SWRConfig value={{ dedupingInterval: 0, errorRetryInterval: 10, provider: () => new Map() }}>
            {mounted && (
                <AddressLayout params={FULFILLED_PARAMS}>
                    <AccountTab />
                </AddressLayout>
            )}
        </SWRConfig>
    );
}

function AccountTab() {
    const refresh = useRefreshAccount();
    const [clicks, setClicks] = useState(0);
    return (
        <>
            <button onClick={() => setClicks(count => count + 1)}>clicks: {clicks}</button>
            <button onClick={() => refresh(ACCOUNT.pubkey, 'parsed')}>refresh</button>
        </>
    );
}
