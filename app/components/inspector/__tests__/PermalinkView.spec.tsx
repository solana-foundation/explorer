import { FetchStatus } from '@providers/cache';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PermalinkView } from '../InspectorPage';

const fetchTransaction = vi.fn();
let cacheEntry: ReturnType<typeof makeEntry> | undefined;

vi.mock('@providers/transactions/raw', () => ({
    useFetchRawTransaction: () => fetchTransaction,
    useRawTransactionDetails: () => cacheEntry,
}));
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
    fetchTransaction.mockReset();
    cacheEntry = undefined;
});
afterEach(() => {
    vi.restoreAllMocks();
});

const props = { reset: () => {}, showTokenBalanceChanges: false, signature: 'sig' };
const renderView = () => render(<PermalinkView {...props} />);

describe('PermalinkView', () => {
    it('should fetch at confirmed commitment on mount', () => {
        renderView();
        expect(fetchTransaction).toHaveBeenCalledWith('sig', 'confirmed');
    });

    it('should show "Transaction was not found" when the fetch returns no transaction', () => {
        cacheEntry = makeEntry(null); // Fetched, raw == null
        renderView();
        expect(screen.getByText('Transaction was not found')).toBeInTheDocument();
    });

    it('should show "Failed to fetch transaction" on FetchFailed', () => {
        cacheEntry = makeEntry(undefined, FetchStatus.FetchFailed);
        renderView();
        expect(screen.getByText('Failed to fetch transaction')).toBeInTheDocument();
    });
});
