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
            blockTime: undefined,
            slot: undefined,
            status: undefined,
        });
    });

    it('parses both slot bounds from the gTFA filter paths', () => {
        setSearch('slot.gte=100&slot.lte=200');
        const { result } = renderHook(() => useHistoryFilters());
        expect(result.current.slot).toEqual({ gte: 100, lte: 200 });
    });

    it('ignores negative and non-numeric values', () => {
        setSearch('slot.gte=-5&slot.lte=abc');
        const { result } = renderHook(() => useHistoryFilters());
        expect(result.current.slot).toBeUndefined();
    });

    it('floors fractional values', () => {
        setSearch('slot.gte=100.9');
        const { result } = renderHook(() => useHistoryFilters());
        expect(result.current.slot).toEqual({ gte: 100, lte: undefined });
    });

    it('parses the status enum, rejecting unknown values', () => {
        setSearch('status=failed');
        const { result } = renderHook(() => useHistoryFilters());
        expect(result.current).toMatchObject({ status: 'failed' });

        setSearch('status=bogus');
        const { result: rejected } = renderHook(() => useHistoryFilters());
        expect(rejected.current).toMatchObject({ status: undefined });
    });

    it('parses block-time bounds from the gTFA filter paths', () => {
        setSearch('blockTime.gte=1700000000&blockTime.lte=1700100000');
        const { result } = renderHook(() => useHistoryFilters());
        expect(result.current.blockTime).toEqual({ gte: 1_700_000_000, lte: 1_700_100_000 });
    });
});

describe('HistoryFilterBar', () => {
    it('shows a single Filters button when no filter is active', () => {
        render(<HistoryFilterBar />);
        expect(screen.getByRole('button', { name: /^Filters$/ })).toBeInTheDocument();
        expect(screen.queryByText(/Slot ≥:/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Slot ≤:/)).not.toBeInTheDocument();
    });

    it('renders a chip per active slot bound', () => {
        render(<HistoryFilterBar slot={{ gte: 100, lte: 2_000_000 }} />);
        expect(screen.getByText(/Slot ≥:\s*100/)).toBeInTheDocument();
        // Use a regex since jsdom's toLocaleString thousand separator varies by ICU build.
        expect(screen.getByText(/Slot ≤:\s*2[,.\s  ]?000[,.\s  ]?000/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Edit filters/ })).toBeInTheDocument();
    });

    it('clears a single slot bound when its chip × is clicked', () => {
        setSearch('slot.gte=100&slot.lte=200');
        render(<HistoryFilterBar slot={{ gte: 100, lte: 200 }} />);

        fireEvent.click(screen.getByRole('button', { name: /Clear slot ≥ filter/ }));

        expect(replaceMock).toHaveBeenCalledTimes(1);
        const [href] = replaceMock.mock.calls[0];
        expect(href).toBe('/address/testAddress?slot.lte=200');
    });

    it('applies both slot bounds from the popover', () => {
        render(<HistoryFilterBar />);

        fireEvent.click(screen.getByRole('button', { name: /^Filters$/ }));
        fireEvent.change(screen.getByPlaceholderText(/lower bound/), { target: { value: '100' } });
        fireEvent.change(screen.getByPlaceholderText(/upper bound/), { target: { value: '500' } });
        fireEvent.click(screen.getByRole('button', { name: /^Apply$/ }));

        expect(replaceMock).toHaveBeenCalledTimes(1);
        const [href] = replaceMock.mock.calls[0];
        expect(href).toMatch(/slot\.gte=100/);
        expect(href).toMatch(/slot\.lte=500/);
    });

    it('preserves unrelated query params when updating the URL', () => {
        setSearch('cluster=devnet&slot.gte=100');
        render(<HistoryFilterBar slot={{ gte: 100 }} />);

        fireEvent.click(screen.getByRole('button', { name: /Clear slot ≥ filter/ }));

        const [href] = replaceMock.mock.calls[0];
        expect(href).toBe('/address/testAddress?cluster=devnet');
    });

    it('disables Apply and shows an error when slot ≥ exceeds slot ≤', () => {
        render(<HistoryFilterBar />);

        fireEvent.click(screen.getByRole('button', { name: /^Filters$/ }));
        fireEvent.change(screen.getByPlaceholderText(/lower bound/), { target: { value: '500' } });
        fireEvent.change(screen.getByPlaceholderText(/upper bound/), { target: { value: '100' } });

        const apply = screen.getByRole('button', { name: /^Apply$/ });
        expect(apply).toBeDisabled();
        expect(screen.getByText(/Slot ≥ must be/)).toBeInTheDocument();

        fireEvent.click(apply);
        expect(replaceMock).not.toHaveBeenCalled();
    });

    it('applies the status select', () => {
        render(<HistoryFilterBar />);

        fireEvent.click(screen.getByRole('button', { name: /^Filters$/ }));
        fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'succeeded' } });
        fireEvent.click(screen.getByRole('button', { name: /^Apply$/ }));

        const [href] = replaceMock.mock.calls[0];
        expect(href).toMatch(/status=succeeded/);
    });

    it('renders a chip for the status filter', () => {
        render(<HistoryFilterBar status="failed" />);
        expect(screen.getByText(/Status:\s*Failed/)).toBeInTheDocument();
    });

    it('clears a single non-slot filter via its chip', () => {
        setSearch('status=failed&slot.lte=200');
        render(<HistoryFilterBar slot={{ lte: 200 }} status="failed" />);

        fireEvent.click(screen.getByRole('button', { name: /Clear status filter/ }));

        const [href] = replaceMock.mock.calls[0];
        expect(href).toBe('/address/testAddress?slot.lte=200');
    });

    it('clears all filters via Clear all', () => {
        setSearch('slot.gte=100&slot.lte=500');
        render(<HistoryFilterBar slot={{ gte: 100, lte: 500 }} />);

        fireEvent.click(screen.getByRole('button', { name: /Edit filters/ }));
        fireEvent.click(screen.getByRole('button', { name: /Clear all/ }));

        const [href] = replaceMock.mock.calls[0];
        expect(href).toBe('/address/testAddress');
    });
});
