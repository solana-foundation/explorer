import type { AccountHistory } from '@features/transaction-history';
import { type CacheEntry, FetchStatus } from '@providers/cache';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TokenInstructionsCard } from '../TokenInstructionsCard';

const mock = vi.hoisted(() => ({ entry: undefined as CacheEntry<AccountHistory> | undefined }));

vi.mock('@providers/accounts', () => ({ useAccountHistory: () => mock.entry }));
vi.mock('@features/transaction-history/model/use-fetch-account-history', () => ({
    useFetchAccountHistory: () => vi.fn(),
}));

describe('TokenInstructionsCard', () => {
    beforeEach(() => {
        mock.entry = { data: HISTORY, status: FetchStatus.Fetched };
    });

    it('should show the checkmark after a refresh succeeds', () => {
        const { rerender } = render(<TokenInstructionsCard address={ADDRESS} />);

        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
        mock.entry = { data: HISTORY, status: FetchStatus.Fetching };
        rerender(<TokenInstructionsCard address={ADDRESS} />);
        mock.entry = { data: HISTORY, status: FetchStatus.Fetched };
        rerender(<TokenInstructionsCard address={ADDRESS} />);

        expect(screen.getByText('Refreshed')).toBeInTheDocument();
    });

    it('should keep the refresh button usable after a refresh fails', () => {
        const { rerender } = render(<TokenInstructionsCard address={ADDRESS} />);

        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
        mock.entry = { data: HISTORY, status: FetchStatus.Fetching };
        rerender(<TokenInstructionsCard address={ADDRESS} />);
        mock.entry = { data: HISTORY, status: FetchStatus.FetchFailed };
        rerender(<TokenInstructionsCard address={ADDRESS} />);

        expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled();
        expect(screen.queryByText('Refreshed')).not.toBeInTheDocument();
    });
});

const ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const HISTORY: AccountHistory = { fetched: [], foundOldest: true, transactionMap: new Map() };
