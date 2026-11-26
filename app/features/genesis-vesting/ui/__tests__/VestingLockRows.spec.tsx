import { type Account } from '@providers/accounts';
import { FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TEAM_LOCK } from '../../__tests__/__fixtures__/lock-accounts';
import { VestingLockRows } from '../VestingLockRows';

const mock = vi.hoisted(() => ({ fetch: vi.fn(), mintStatus: 0 }));

vi.mock('@providers/accounts', () => ({
    useAccountInfo: () => ({ data: undefined, status: mock.mintStatus }),
    useFetchAccountInfo: () => mock.fetch,
    useMintAccountInfo: () => undefined,
}));
vi.mock('@components/common/Address', () => ({ Address: () => null }));

describe('VestingLockRows', () => {
    beforeEach(() => {
        mock.fetch.mockClear();
        mock.mintStatus = FetchStatus.FetchFailed;
    });

    it('should offer a retry that fetches the mint again when the mint failed to load', () => {
        render(<VestingLockRows account={lockAccount()} />);
        mock.fetch.mockClear();

        expect(screen.getByText('Failed to load the token mint.')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
        expect(mock.fetch).toHaveBeenCalledOnce();
    });

    it('should fetch the mint again when the lock account is refreshed', () => {
        const { rerender } = render(<VestingLockRows account={lockAccount()} />);
        mock.fetch.mockClear();

        // The card's Refresh reloads the lock, which hands the rows a new account object.
        rerender(<VestingLockRows account={lockAccount()} />);
        expect(mock.fetch).toHaveBeenCalledOnce();
    });
});

function lockAccount(): Account {
    return {
        data: { raw: Buffer.from(TEAM_LOCK.base64, 'base64') },
        executable: false,
        lamports: 1,
        owner: new PublicKey('GNS1S5J5AspKXgpjz6SvKL66kPaKWAhaGRhCqPRxii2B'),
        pubkey: new PublicKey(TEAM_LOCK.address),
        space: 944,
    } as Account;
}
