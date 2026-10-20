import { gen } from '@__fixtures__/gen';
import type { Account } from '@providers/accounts';
import { type CacheEntry, FetchStatus } from '@providers/cache';
import { address } from '@solana/kit';
import {
    AccountDiscriminator,
    getSubscriptionAuthorityEncoder,
    SUBSCRIPTIONS_PROGRAM_ADDRESS,
} from '@solana/subscriptions';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toLegacyPublicKey } from '@/app/shared/lib/web3js-compat';

import { SubscriptionsAccountCard } from '../SubscriptionsAccountCard';

const mock = vi.hoisted(() => ({ entry: undefined as CacheEntry<Account> | undefined }));

vi.mock('@providers/accounts', () => ({
    useAccountInfo: (address: string) => (address === ACCOUNT.pubkey.toBase58() ? mock.entry : undefined),
}));
vi.mock('@entities/account', () => ({
    useRawAccountDataOnMount: () => ({ data: undefined, isLoading: false }),
    useRefreshAccount: () => vi.fn(),
}));
vi.mock('@components/common/KitAddress', () => ({ KitAddress: () => null }));

describe('SubscriptionsAccountCard', () => {
    beforeEach(() => {
        mock.entry = undefined;
    });

    it('should disable the refresh button while the account is fetching', () => {
        mock.entry = { data: ACCOUNT, status: FetchStatus.Fetching };
        renderCard();

        expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
        expect(screen.getByText('Loading')).toBeInTheDocument();
    });

    it('should enable the refresh button when the account is fetched', () => {
        mock.entry = { data: ACCOUNT, status: FetchStatus.Fetched };
        renderCard();

        expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled();
    });
});

const RAW = new Uint8Array(
    getSubscriptionAuthorityEncoder().encode({
        bump: 254,
        discriminator: AccountDiscriminator.SubscriptionAuthority,
        initId: 7n,
        payer: address(gen.address(1)),
        tokenMint: address(gen.address(2)),
        user: address(gen.address(3)),
    }),
);

const ACCOUNT: Account = {
    data: { raw: RAW },
    executable: false,
    lamports: 1,
    owner: toLegacyPublicKey(address(SUBSCRIPTIONS_PROGRAM_ADDRESS)),
    pubkey: gen.publicKey(0),
    space: RAW.length,
};

function renderCard() {
    render(
        <SubscriptionsAccountCard
            account={ACCOUNT}
            onNotFound={() => {
                throw new Error('account not found');
            }}
        />,
    );
}
