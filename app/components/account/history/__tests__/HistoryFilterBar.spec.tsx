/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
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
    it('should return all-undefined when no params are set', () => {
        setSearch('');
        const { result } = renderHook(() => useHistoryFilters());
        expect(result.current).toEqual({
            blockTime: undefined,
            slot: undefined,
            status: undefined,
        });
    });

    it('should parse both slot bounds from the gTFA filter paths', () => {
        setSearch('slot.gte=100&slot.lte=200');
        const { result } = renderHook(() => useHistoryFilters());
        expect(result.current.slot).toEqual({ gte: 100, lte: 200 });
    });

    it('should ignore negative and non-numeric values', () => {
        setSearch('slot.gte=-5&slot.lte=abc');
        const { result } = renderHook(() => useHistoryFilters());
        expect(result.current.slot).toBeUndefined();
    });

    it('should floor fractional values', () => {
        setSearch('slot.gte=100.9');
        const { result } = renderHook(() => useHistoryFilters());
        expect(result.current.slot).toEqual({ gte: 100, lte: undefined });
    });

    it('should parse the status enum, rejecting unknown values', () => {
        setSearch('status=failed');
        const { result } = renderHook(() => useHistoryFilters());
        expect(result.current).toMatchObject({ status: 'failed' });

        setSearch('status=bogus');
        const { result: rejected } = renderHook(() => useHistoryFilters());
        expect(rejected.current).toMatchObject({ status: undefined });
    });

    it('should parse block-time bounds from the gTFA filter paths', () => {
        setSearch('blockTime.gte=1700000000&blockTime.lte=1700100000');
        const { result } = renderHook(() => useHistoryFilters());
        expect(result.current.blockTime).toEqual({ gte: 1_700_000_000, lte: 1_700_100_000 });
    });
});

describe('HistoryFilterBar', () => {
    it('should show a single Filters button when no filter is active', () => {
        render(<HistoryFilterBar />);
        expect(screen.getByRole('button', { name: /^Filters$/ })).toBeInTheDocument();
        expect(screen.queryByText(/Slot ≥:/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Slot ≤:/)).not.toBeInTheDocument();
    });

    it('should render a chip per active slot bound', () => {
        render(<HistoryFilterBar slot={{ gte: 100, lte: 2_000_000 }} />);
        expect(screen.getByText(/Slot ≥:\s*100/)).toBeInTheDocument();
        // Use a regex since jsdom's toLocaleString thousand separator varies by ICU build.
        expect(screen.getByText(/Slot ≤:\s*2[,.\s  ]?000[,.\s  ]?000/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Edit filters/ })).toBeInTheDocument();
    });

    it('should clear a single slot bound when its chip × is clicked', () => {
        setSearch('slot.gte=100&slot.lte=200');
        render(<HistoryFilterBar slot={{ gte: 100, lte: 200 }} />);

        fireEvent.click(screen.getByRole('button', { name: /Clear slot ≥ filter/ }));

        expect(replaceMock).toHaveBeenCalledTimes(1);
        const [href] = replaceMock.mock.calls[0];
        expect(href).toBe('/address/testAddress?slot.lte=200');
    });

    it('should apply both slot bounds from the popover', () => {
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

    it('should preserve unrelated query params when updating the URL', () => {
        setSearch('cluster=devnet&slot.gte=100');
        render(<HistoryFilterBar slot={{ gte: 100 }} />);

        fireEvent.click(screen.getByRole('button', { name: /Clear slot ≥ filter/ }));

        const [href] = replaceMock.mock.calls[0];
        expect(href).toBe('/address/testAddress?cluster=devnet');
    });

    it('should disable Apply and show an error when slot ≥ exceeds slot ≤', () => {
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

    it('should apply the status select', () => {
        render(<HistoryFilterBar />);

        fireEvent.click(screen.getByRole('button', { name: /^Filters$/ }));
        fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'succeeded' } });
        fireEvent.click(screen.getByRole('button', { name: /^Apply$/ }));

        const [href] = replaceMock.mock.calls[0];
        expect(href).toMatch(/status=succeeded/);
    });

    it('should render a chip for the status filter', () => {
        render(<HistoryFilterBar status="failed" />);
        expect(screen.getByText(/Status:\s*Failed/)).toBeInTheDocument();
    });

    it('should clear a single non-slot filter via its chip', () => {
        setSearch('status=failed&slot.lte=200');
        render(<HistoryFilterBar slot={{ lte: 200 }} status="failed" />);

        fireEvent.click(screen.getByRole('button', { name: /Clear status filter/ }));

        const [href] = replaceMock.mock.calls[0];
        expect(href).toBe('/address/testAddress?slot.lte=200');
    });

    it('should clear all filters via Clear all', () => {
        setSearch('slot.gte=100&slot.lte=500');
        render(<HistoryFilterBar slot={{ gte: 100, lte: 500 }} />);

        fireEvent.click(screen.getByRole('button', { name: /Edit filters/ }));
        fireEvent.click(screen.getByRole('button', { name: /Clear all/ }));

        const [href] = replaceMock.mock.calls[0];
        expect(href).toBe('/address/testAddress');
    });
});
