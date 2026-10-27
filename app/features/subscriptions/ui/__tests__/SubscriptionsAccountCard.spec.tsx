import {
    SUBSCRIPTION_AUTHORITY_BYTES,
    subscriptionsAccount,
} from '@features/subscriptions/__fixtures__/subscriptions-accounts';
import type { Account } from '@providers/accounts';
import { type CacheEntry, FetchStatus } from '@providers/cache';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SubscriptionsAccountCard } from '../SubscriptionsAccountCard';

const mock = vi.hoisted(() => ({ entry: undefined as CacheEntry<Account> | undefined }));

vi.mock('@providers/accounts', () => ({
    useAccountInfo: (address: string) => (address === ACCOUNT.pubkey.toBase58() ? mock.entry : undefined),
}));
vi.mock('@entities/account', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/account')>()),
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

const ACCOUNT = subscriptionsAccount(SUBSCRIPTION_AUTHORITY_BYTES);

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
