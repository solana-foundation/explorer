import type { Account } from '@providers/accounts';
import { type CacheEntry, FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountCard } from '../AccountCard';

const mock = vi.hoisted(() => ({ entry: undefined as CacheEntry<Account> | undefined }));

vi.mock('@providers/accounts', () => ({
    useAccountInfo: (address: string) => (address === ACCOUNT.pubkey.toBase58() ? mock.entry : undefined),
}));
vi.mock('@entities/account', () => ({ useRawAccountDataOnMount: () => ({ data: undefined, isLoading: false }) }));
vi.mock('../AccountDownloadDropdown', () => ({ AccountDownloadDropdown: () => null }));

describe('AccountCard', () => {
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

    it('should enable the refresh button for an account that is not in the cache', () => {
        renderCard();

        expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled();
    });
});

const ACCOUNT: Account = {
    data: {},
    executable: false,
    lamports: 1,
    owner: PublicKey.default,
    pubkey: new PublicKey(1),
    space: 0,
};

function renderCard() {
    render(
        <AccountCard title="Account" account={ACCOUNT} refresh={vi.fn()} analyticsSection="test_section">
            <tr>
                <td>Row</td>
            </tr>
        </AccountCard>,
    );
}
