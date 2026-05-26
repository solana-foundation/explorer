import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const replaceMock = vi.fn();
let mockSearchString = '';

vi.mock('next/navigation', () => ({
    usePathname: () => '/address/testAddress',
    useRouter: () => ({ replace: replaceMock }),
    useSearchParams: () => new URLSearchParams(mockSearchString),
}));

// Must import after mocks
import { HistoryFilterBar, useHistoryFilters } from '../HistoryFilterBar';

function setSearch(search: string) {
    mockSearchString = search;
}

beforeEach(() => {
    replaceMock.mockClear();
    setSearch('');
});

describe('useHistoryFilters', () => {
    it('returns all-undefined when no params are set', () => {
        setSearch('');
        const { result } = renderHook(() => useHistoryFilters());
        expect(result.current).toEqual({
            beforeSlot: undefined,
            blockTimeFrom: undefined,
            blockTimeTo: undefined,
            status: undefined,
            tokenAccounts: undefined,
            untilSlot: undefined,
        });
    });

    it('parses both slot bounds from the URL', () => {
        setSearch('untilSlot=100&beforeSlot=200');
        const { result } = renderHook(() => useHistoryFilters());
        expect(result.current).toMatchObject({ beforeSlot: 200, untilSlot: 100 });
    });

    it('ignores negative and non-numeric values', () => {
        setSearch('untilSlot=-5&beforeSlot=abc');
        const { result } = renderHook(() => useHistoryFilters());
        expect(result.current).toMatchObject({ beforeSlot: undefined, untilSlot: undefined });
    });

    it('floors fractional values', () => {
        setSearch('untilSlot=100.9');
        const { result } = renderHook(() => useHistoryFilters());
        expect(result.current.untilSlot).toBe(100);
    });

    it('parses status and token-account enums, rejecting unknown values', () => {
        setSearch('status=failed&tokenAccounts=balanceChanged');
        const { result } = renderHook(() => useHistoryFilters());
        expect(result.current).toMatchObject({ status: 'failed', tokenAccounts: 'balanceChanged' });

        setSearch('status=bogus&tokenAccounts=nope');
        const { result: rejected } = renderHook(() => useHistoryFilters());
        expect(rejected.current).toMatchObject({ status: undefined, tokenAccounts: undefined });
    });

    it('parses block-time bounds', () => {
        setSearch('blockTimeFrom=1700000000&blockTimeTo=1700100000');
        const { result } = renderHook(() => useHistoryFilters());
        expect(result.current).toMatchObject({ blockTimeFrom: 1_700_000_000, blockTimeTo: 1_700_100_000 });
    });
});

describe('HistoryFilterBar', () => {
    it('shows a single Filters button when no filter is active', () => {
        render(<HistoryFilterBar untilSlot={undefined} beforeSlot={undefined} />);
        expect(screen.getByRole('button', { name: /^Filters$/ })).toBeInTheDocument();
        expect(screen.queryByText(/Until slot:/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Before slot:/)).not.toBeInTheDocument();
    });

    it('renders a chip per active filter', () => {
        render(<HistoryFilterBar untilSlot={100} beforeSlot={2_000_000} />);
        expect(screen.getByText(/Until slot:\s*100/)).toBeInTheDocument();
        // Use a regex since jsdom's toLocaleString thousand separator varies by ICU build.
        expect(screen.getByText(/Before slot:\s*2[,.\s  ]?000[,.\s  ]?000/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Edit filters/ })).toBeInTheDocument();
    });

    it('clears a single filter when its chip × is clicked', () => {
        setSearch('untilSlot=100&beforeSlot=200');
        render(<HistoryFilterBar untilSlot={100} beforeSlot={200} />);

        fireEvent.click(screen.getByRole('button', { name: /Clear until slot filter/ }));

        expect(replaceMock).toHaveBeenCalledTimes(1);
        const [href] = replaceMock.mock.calls[0];
        expect(href).toBe('/address/testAddress?beforeSlot=200');
    });

    it('applies both bounds from the popover', () => {
        render(<HistoryFilterBar untilSlot={undefined} beforeSlot={undefined} />);

        fireEvent.click(screen.getByRole('button', { name: /^Filters$/ }));
        fireEvent.change(screen.getByPlaceholderText(/lower bound/), { target: { value: '100' } });
        fireEvent.change(screen.getByPlaceholderText(/upper bound/), { target: { value: '500' } });
        fireEvent.click(screen.getByRole('button', { name: /^Apply$/ }));

        expect(replaceMock).toHaveBeenCalledTimes(1);
        const [href] = replaceMock.mock.calls[0];
        expect(href).toMatch(/untilSlot=100/);
        expect(href).toMatch(/beforeSlot=500/);
    });

    it('preserves unrelated query params when updating the URL', () => {
        setSearch('cluster=devnet&untilSlot=100');
        render(<HistoryFilterBar untilSlot={100} beforeSlot={undefined} />);

        fireEvent.click(screen.getByRole('button', { name: /Clear until slot filter/ }));

        const [href] = replaceMock.mock.calls[0];
        expect(href).toBe('/address/testAddress?cluster=devnet');
    });

    it('disables Apply and shows an error when until > before', () => {
        render(<HistoryFilterBar untilSlot={undefined} beforeSlot={undefined} />);

        fireEvent.click(screen.getByRole('button', { name: /^Filters$/ }));
        fireEvent.change(screen.getByPlaceholderText(/lower bound/), { target: { value: '500' } });
        fireEvent.change(screen.getByPlaceholderText(/upper bound/), { target: { value: '100' } });

        const apply = screen.getByRole('button', { name: /^Apply$/ });
        expect(apply).toBeDisabled();
        expect(screen.getByText(/Until slot must be/)).toBeInTheDocument();

        fireEvent.click(apply);
        expect(replaceMock).not.toHaveBeenCalled();
    });

    it('applies the status and token-account selects', () => {
        render(<HistoryFilterBar untilSlot={undefined} beforeSlot={undefined} />);

        fireEvent.click(screen.getByRole('button', { name: /^Filters$/ }));
        fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'succeeded' } });
        fireEvent.change(screen.getByLabelText('Token accounts'), { target: { value: 'all' } });
        fireEvent.click(screen.getByRole('button', { name: /^Apply$/ }));

        const [href] = replaceMock.mock.calls[0];
        expect(href).toMatch(/status=succeeded/);
        expect(href).toMatch(/tokenAccounts=all/);
    });

    it('renders chips for status and token-account filters', () => {
        render(<HistoryFilterBar untilSlot={undefined} beforeSlot={undefined} status="failed" tokenAccounts="all" />);
        expect(screen.getByText(/Status:\s*Failed/)).toBeInTheDocument();
        expect(screen.getByText(/Token accounts:\s*All token accounts/)).toBeInTheDocument();
    });

    it('clears a single non-slot filter via its chip', () => {
        setSearch('status=failed&beforeSlot=200');
        render(<HistoryFilterBar untilSlot={undefined} beforeSlot={200} status="failed" />);

        fireEvent.click(screen.getByRole('button', { name: /Clear status filter/ }));

        const [href] = replaceMock.mock.calls[0];
        expect(href).toBe('/address/testAddress?beforeSlot=200');
    });

    it('clears all filters via Clear all', () => {
        setSearch('untilSlot=100&beforeSlot=500');
        render(<HistoryFilterBar untilSlot={100} beforeSlot={500} />);

        fireEvent.click(screen.getByRole('button', { name: /Edit filters/ }));
        fireEvent.click(screen.getByRole('button', { name: /Clear all/ }));

        const [href] = replaceMock.mock.calls[0];
        expect(href).toBe('/address/testAddress');
    });
});
