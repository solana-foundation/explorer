import { FetchStatus } from '@providers/cache';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NOT_FOUND_BAILOUT, PermalinkView } from '../InspectorPage';

const fetchTransaction = vi.fn();
let cacheEntry: ReturnType<typeof makeEntry> | undefined;

vi.mock('@providers/transactions/raw', () => ({
    useFetchRawTransaction: () => fetchTransaction,
    useRawTransactionDetails: () => cacheEntry,
}));
vi.mock('@utils/use-tab-visibility', () => ({ default: () => ({ visible: true }) }));
// InspectorPage imports router/search-param/pathname hooks from next/navigation at module scope;
// stub them so importing PermalinkView from it doesn't blow up.
vi.mock('next/navigation', () => ({
    usePathname: () => '/tx/inspector',
    useRouter: () => ({ push: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
}));

// Minimal stand-in for a decoded raw tx; only the fields PermalinkView reads.
function makeEntry(raw: unknown, status = FetchStatus.Fetched) {
    return { data: { raw }, status };
}

beforeEach(() => {
    vi.useFakeTimers();
    fetchTransaction.mockReset();
    cacheEntry = undefined;
});
afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

const props = { reset: () => {}, showTokenBalanceChanges: false, signature: 'sig' };
const renderView = () => render(<PermalinkView {...props} />);

describe('PermalinkView', () => {
    it('should fetch at confirmed commitment on mount', () => {
        renderView();
        expect(fetchTransaction).toHaveBeenCalledWith('sig', 'confirmed');
    });

    it('should show the waiting preloader while raw is null', () => {
        cacheEntry = makeEntry(null);
        renderView();
        expect(screen.getByText('Waiting for transaction to be confirmed...')).toBeInTheDocument();
    });

    it('should show "Transaction was not found" after NOT_FOUND_BAILOUT empty retries and stop polling', () => {
        cacheEntry = makeEntry(null);
        const { rerender } = renderView();
        for (let i = 0; i < NOT_FOUND_BAILOUT; i++) {
            act(() => vi.advanceTimersByTime(2000));
            rerender(<PermalinkView {...props} />);
        }
        expect(screen.getByText('Transaction was not found')).toBeInTheDocument();
        // Polled exactly NOT_FOUND_BAILOUT times, then bailed out — further ticks do not fetch.
        expect(fetchTransaction).toHaveBeenCalledTimes(NOT_FOUND_BAILOUT);
        act(() => vi.advanceTimersByTime(2000 * 3));
        expect(fetchTransaction).toHaveBeenCalledTimes(NOT_FOUND_BAILOUT);
    });

    it('should reset the retry counter when the signature changes without a remount', () => {
        cacheEntry = makeEntry(null);
        const { rerender } = renderView();
        for (let i = 0; i < NOT_FOUND_BAILOUT; i++) {
            act(() => vi.advanceTimersByTime(2000));
            rerender(<PermalinkView {...props} />);
        }
        expect(screen.getByText('Transaction was not found')).toBeInTheDocument();

        // Navigating to a fresh signature resets retries, so polling resumes from the preloader.
        rerender(<PermalinkView {...props} signature="sig2" />);
        expect(screen.getByText('Waiting for transaction to be confirmed...')).toBeInTheDocument();
    });

    it('should show "Failed to fetch transaction" on FetchFailed', () => {
        cacheEntry = makeEntry(undefined, FetchStatus.FetchFailed);
        renderView();
        expect(screen.getByText('Failed to fetch transaction')).toBeInTheDocument();
    });
});
