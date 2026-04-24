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
import { HistoryFilterBar, useSlotFilters } from '../HistoryFilterBar';

function setSearch(search: string) {
    mockSearchString = search;
}

beforeEach(() => {
    replaceMock.mockClear();
    setSearch('');
});

describe('useSlotFilters', () => {
    it('returns undefined for both when no params are set', () => {
        setSearch('');
        const { result } = renderHook(() => useSlotFilters());
        expect(result.current).toEqual({ afterSlot: undefined, beforeSlot: undefined });
    });

    it('parses both slot bounds from the URL', () => {
        setSearch('afterSlot=100&beforeSlot=200');
        const { result } = renderHook(() => useSlotFilters());
        expect(result.current).toEqual({ afterSlot: 100, beforeSlot: 200 });
    });

    it('ignores negative and non-numeric values', () => {
        setSearch('afterSlot=-5&beforeSlot=abc');
        const { result } = renderHook(() => useSlotFilters());
        expect(result.current).toEqual({ afterSlot: undefined, beforeSlot: undefined });
    });

    it('floors fractional values', () => {
        setSearch('afterSlot=100.9');
        const { result } = renderHook(() => useSlotFilters());
        expect(result.current.afterSlot).toBe(100);
    });
});

describe('HistoryFilterBar', () => {
    it('shows a single Filters button when no filter is active', () => {
        render(<HistoryFilterBar afterSlot={undefined} beforeSlot={undefined} />);
        expect(screen.getByRole('button', { name: /^Filters$/ })).toBeInTheDocument();
        expect(screen.queryByText(/After slot:/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Before slot:/)).not.toBeInTheDocument();
    });

    it('renders a chip per active filter', () => {
        render(<HistoryFilterBar afterSlot={100} beforeSlot={2_000_000} />);
        expect(screen.getByText(/After slot:\s*100/)).toBeInTheDocument();
        // Use a regex since jsdom's toLocaleString thousand separator varies by ICU build.
        expect(screen.getByText(/Before slot:\s*2[,.\s  ]?000[,.\s  ]?000/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Edit filters/ })).toBeInTheDocument();
    });

    it('clears a single filter when its chip × is clicked', () => {
        setSearch('afterSlot=100&beforeSlot=200');
        render(<HistoryFilterBar afterSlot={100} beforeSlot={200} />);

        fireEvent.click(screen.getByRole('button', { name: /Clear after slot filter/ }));

        expect(replaceMock).toHaveBeenCalledTimes(1);
        const [href] = replaceMock.mock.calls[0];
        expect(href).toBe('/address/testAddress?beforeSlot=200');
    });

    it('applies both bounds from the popover', () => {
        render(<HistoryFilterBar afterSlot={undefined} beforeSlot={undefined} />);

        fireEvent.click(screen.getByRole('button', { name: /^Filters$/ }));
        fireEvent.change(screen.getByPlaceholderText(/lower bound/), { target: { value: '100' } });
        fireEvent.change(screen.getByPlaceholderText(/upper bound/), { target: { value: '500' } });
        fireEvent.click(screen.getByRole('button', { name: /^Apply$/ }));

        expect(replaceMock).toHaveBeenCalledTimes(1);
        const [href] = replaceMock.mock.calls[0];
        expect(href).toMatch(/afterSlot=100/);
        expect(href).toMatch(/beforeSlot=500/);
    });

    it('preserves unrelated query params when updating the URL', () => {
        setSearch('cluster=devnet&afterSlot=100');
        render(<HistoryFilterBar afterSlot={100} beforeSlot={undefined} />);

        fireEvent.click(screen.getByRole('button', { name: /Clear after slot filter/ }));

        const [href] = replaceMock.mock.calls[0];
        expect(href).toBe('/address/testAddress?cluster=devnet');
    });

    it('disables Apply and shows an error when after > before', () => {
        render(<HistoryFilterBar afterSlot={undefined} beforeSlot={undefined} />);

        fireEvent.click(screen.getByRole('button', { name: /^Filters$/ }));
        fireEvent.change(screen.getByPlaceholderText(/lower bound/), { target: { value: '500' } });
        fireEvent.change(screen.getByPlaceholderText(/upper bound/), { target: { value: '100' } });

        const apply = screen.getByRole('button', { name: /^Apply$/ });
        expect(apply).toBeDisabled();
        expect(screen.getByText(/After slot must be/)).toBeInTheDocument();

        fireEvent.click(apply);
        expect(replaceMock).not.toHaveBeenCalled();
    });

    it('clears all filters via Clear all', () => {
        setSearch('afterSlot=100&beforeSlot=500');
        render(<HistoryFilterBar afterSlot={100} beforeSlot={500} />);

        fireEvent.click(screen.getByRole('button', { name: /Edit filters/ }));
        fireEvent.click(screen.getByRole('button', { name: /Clear all/ }));

        const [href] = replaceMock.mock.calls[0];
        expect(href).toBe('/address/testAddress');
    });
});
