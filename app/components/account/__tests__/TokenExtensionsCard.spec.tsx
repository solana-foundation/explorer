import { gen } from '@__fixtures__/gen';
import { GENESIS_HASHES } from '@entities/chain-id';
import { tokenInfo } from '@entities/token-info/__fixtures__/token-info';
import type { Account } from '@providers/accounts';
import { type CacheEntry, FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ClusterContext, connectedWithGenesisHash, swrWrapper } from '@/app/__tests__/swr-hook';
import { LABEL_CLUSTER, readLabelAfterFailedCardRequest, stubTokenInfoApi } from '@/app/__tests__/token-label';

import { TokenExtensionsCard } from '../TokenExtensionsCard';

const mock = vi.hoisted(() => ({
    cluster: undefined as ClusterContext | undefined,
    entry: undefined as CacheEntry<Account> | undefined,
}));

vi.mock('@providers/accounts', () => ({
    useAccountInfo: (address: string) => (address === MINT ? mock.entry : undefined),
}));
vi.mock('@providers/cluster', () => ({ useCluster: () => mock.cluster }));
vi.mock('@entities/account', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/account')>()),
    useRefreshAccount: () => vi.fn(),
}));
vi.mock('../TokenExtensionsSection', () => ({
    TokenExtensionsSection: ({ symbol }: { symbol?: string }) => <span>{symbol}</span>,
}));

describe('TokenExtensionsCard', () => {
    beforeEach(() => {
        mock.cluster = connectedWithGenesisHash(Cluster.MainnetBeta, GENESIS_HASHES.MAINNET);
        mock.entry = undefined;
        stubTokenInfoApi([USDC]);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should disable the refresh button while the mint is fetching', async () => {
        mock.entry = { data: ACCOUNT, status: FetchStatus.Fetching };
        renderCard();

        expect(await screen.findByRole('button', { name: 'Refresh' })).toBeDisabled();
        expect(screen.getByText('Loading')).toBeInTheDocument();
    });

    it('should enable the refresh button when the mint is fetched', async () => {
        mock.entry = { data: ACCOUNT, status: FetchStatus.Fetched };
        renderCard();

        expect(await screen.findByRole('button', { name: 'Refresh' })).toBeEnabled();
    });

    it('should show the token symbol on a custom cluster with the mainnet genesis hash', async () => {
        mock.cluster = connectedWithGenesisHash(Cluster.Custom, GENESIS_HASHES.MAINNET);
        mock.entry = { data: ACCOUNT, status: FetchStatus.Fetched };
        renderCard();

        expect(await screen.findByText('USDC')).toBeInTheDocument();
    });

    it('should keep the token label that the batch provider stored when the card request fails', async () => {
        mock.cluster = LABEL_CLUSTER;
        const label = await readLabelAfterFailedCardRequest(
            <TokenExtensionsCard address={MINT} decimals={6} extensions={[]} />,
            USDC,
        );

        expect(label).toHaveTextContent('USDC');
    });
});

const MINT = gen.address(0);
const USDC = { ...tokenInfo(MINT), symbol: 'USDC' };

const ACCOUNT: Account = {
    data: {},
    executable: false,
    lamports: 1,
    owner: PublicKey.default,
    pubkey: new PublicKey(MINT),
    space: 0,
};

function renderCard() {
    render(<TokenExtensionsCard address={MINT} decimals={6} extensions={[]} />, { wrapper: swrWrapper() });
}
