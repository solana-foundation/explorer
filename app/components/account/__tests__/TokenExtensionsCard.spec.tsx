import { gen } from '@__fixtures__/gen';
import type { Account } from '@providers/accounts';
import { type CacheEntry, FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TokenExtensionsCard } from '../TokenExtensionsCard';

const mock = vi.hoisted(() => ({ entry: undefined as CacheEntry<Account> | undefined }));

vi.mock('@providers/accounts', () => ({
    useAccountInfo: (address: string) => (address === MINT ? mock.entry : undefined),
}));
vi.mock('@providers/cluster', () => ({
    useCluster: () => ({ cluster: Cluster.MainnetBeta, url: 'https://api.mainnet-beta.solana.com' }),
}));
vi.mock('@entities/account', () => ({ useRefreshAccount: () => vi.fn() }));
vi.mock('@/app/utils/token-info', async importOriginal => ({
    ...(await importOriginal<typeof import('@/app/utils/token-info')>()),
    getTokenInfo: vi.fn(async () => undefined),
}));
vi.mock('../TokenExtensionsSection', () => ({ TokenExtensionsSection: () => null }));

describe('TokenExtensionsCard', () => {
    beforeEach(() => {
        mock.entry = undefined;
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
});

const MINT = gen.address(0);

const ACCOUNT: Account = {
    data: {},
    executable: false,
    lamports: 1,
    owner: PublicKey.default,
    pubkey: new PublicKey(MINT),
    space: 0,
};

function renderCard() {
    render(<TokenExtensionsCard address={MINT} decimals={6} extensions={[]} />);
}
