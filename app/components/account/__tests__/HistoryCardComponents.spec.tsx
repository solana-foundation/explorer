import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { HistoryCardHeader, HistoryCardFooter, getTransactionRows } from '../HistoryCardComponents';

describe('HistoryCardHeader', () => {
    it('should render title and refresh button', () => {
        const mockRefresh = vi.fn();

        render(<HistoryCardHeader title="Transaction History" refresh={mockRefresh} fetching={false} />);

        expect(screen.getByText('Transaction History')).toBeInTheDocument();
        expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('should call refresh when refresh button is clicked', async () => {
        const user = userEvent.setup();
        const mockRefresh = vi.fn();

        render(<HistoryCardHeader title="Transaction History" refresh={mockRefresh} fetching={false} />);

        const refreshButton = screen.getByText('Refresh').closest('button');
        expect(refreshButton).not.toBeNull();

        await user.click(refreshButton!);
        expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('should disable refresh button when fetching', () => {
        const mockRefresh = vi.fn();

        render(<HistoryCardHeader title="Transaction History" refresh={mockRefresh} fetching={true} />);

        const refreshButton = screen.getByText('Loading').closest('button');
        expect(refreshButton).toBeDisabled();
    });

    it('should not render filter button when filter props are not provided', () => {
        const mockRefresh = vi.fn();

        render(<HistoryCardHeader title="Transaction History" refresh={mockRefresh} fetching={false} />);

        expect(screen.queryByText('Hide Failed')).not.toBeInTheDocument();
        expect(screen.queryByText('Show All')).not.toBeInTheDocument();
    });

    it('should render "Hide Failed" button when hideFailedTxs is false', () => {
        const mockRefresh = vi.fn();
        const mockToggle = vi.fn();

        render(
            <HistoryCardHeader
                title="Transaction History"
                refresh={mockRefresh}
                fetching={false}
                hideFailedTxs={false}
                onToggleHideFailedTxs={mockToggle}
            />
        );

        expect(screen.getByText('Hide Failed')).toBeInTheDocument();
    });

    it('should render "Show All" button when hideFailedTxs is true', () => {
        const mockRefresh = vi.fn();
        const mockToggle = vi.fn();

        render(
            <HistoryCardHeader
                title="Transaction History"
                refresh={mockRefresh}
                fetching={false}
                hideFailedTxs={true}
                onToggleHideFailedTxs={mockToggle}
            />
        );

        expect(screen.getByText('Show All')).toBeInTheDocument();
    });

    it('should call onToggleHideFailedTxs with opposite value when filter button is clicked', async () => {
        const user = userEvent.setup();
        const mockRefresh = vi.fn();
        const mockToggle = vi.fn();

        render(
            <HistoryCardHeader
                title="Transaction History"
                refresh={mockRefresh}
                fetching={false}
                hideFailedTxs={false}
                onToggleHideFailedTxs={mockToggle}
            />
        );

        const filterButton = screen.getByText('Hide Failed').closest('button');
        expect(filterButton).not.toBeNull();

        await user.click(filterButton!);
        expect(mockToggle).toHaveBeenCalledTimes(1);
        expect(mockToggle).toHaveBeenCalledWith(true);
    });

    it('should disable filter button when fetching', () => {
        const mockRefresh = vi.fn();
        const mockToggle = vi.fn();

        render(
            <HistoryCardHeader
                title="Transaction History"
                refresh={mockRefresh}
                fetching={true}
                hideFailedTxs={false}
                onToggleHideFailedTxs={mockToggle}
            />
        );

        const filterButton = screen.getByText('Hide Failed').closest('button');
        expect(filterButton).toBeDisabled();
    });

    it('should render both filter and refresh buttons when filter props are provided', () => {
        const mockRefresh = vi.fn();
        const mockToggle = vi.fn();

        render(
            <HistoryCardHeader
                title="Transaction History"
                refresh={mockRefresh}
                fetching={false}
                hideFailedTxs={false}
                onToggleHideFailedTxs={mockToggle}
            />
        );

        expect(screen.getByText('Hide Failed')).toBeInTheDocument();
        expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
});

describe('HistoryCardFooter', () => {
    it('should render "Load More" button when not at oldest', () => {
        const mockLoadMore = vi.fn();

        render(<HistoryCardFooter fetching={false} foundOldest={false} loadMore={mockLoadMore} />);

        expect(screen.getByText('Load More')).toBeInTheDocument();
    });

    it('should render "Fetched full history" when at oldest', () => {
        const mockLoadMore = vi.fn();

        render(<HistoryCardFooter fetching={true} foundOldest={true} loadMore={mockLoadMore} />);

        expect(screen.getByText('Fetched full history')).toBeInTheDocument();
        expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });

    it('should call loadMore when button is clicked', async () => {
        const user = userEvent.setup();
        const mockLoadMore = vi.fn();

        render(<HistoryCardFooter fetching={false} foundOldest={false} loadMore={mockLoadMore} />);

        const loadMoreButton = screen.getByText('Load More').closest('button');
        expect(loadMoreButton).not.toBeNull();

        await user.click(loadMoreButton!);
        expect(mockLoadMore).toHaveBeenCalledTimes(1);
    });

    it('should disable "Load More" button when fetching', () => {
        const mockLoadMore = vi.fn();

        render(<HistoryCardFooter fetching={true} foundOldest={false} loadMore={mockLoadMore} />);

        const loadMoreButton = screen.getByText('Loading').closest('button');
        expect(loadMoreButton).toBeDisabled();
    });
});

describe('getTransactionRows', () => {
    it('should return empty array for empty input', () => {
        const result = getTransactionRows([]);
        expect(result).toEqual([]);
    });

    it('should mark transaction with err as failed', () => {
        const mockSignatures = [
            {
                blockTime: 1234567890,
                confirmationStatus: 'finalized' as const,
                err: { InstructionError: [0, 'Custom error'] },
                memo: null,
                signature: 'signature1',
                slot: 100,
            },
        ];

        const result = getTransactionRows(mockSignatures);

        expect(result).toHaveLength(1);
        expect(result[0].statusClass).toBe('warning');
        expect(result[0].statusText).toBe('Failed');
        expect(result[0].err).not.toBeNull();
    });

    it('should mark transaction without err as success', () => {
        const mockSignatures = [
            {
                blockTime: 1234567890,
                confirmationStatus: 'finalized' as const,
                err: null,
                memo: null,
                signature: 'signature2',
                slot: 101,
            },
        ];

        const result = getTransactionRows(mockSignatures);

        expect(result).toHaveLength(1);
        expect(result[0].statusClass).toBe('success');
        expect(result[0].statusText).toBe('Success');
        expect(result[0].err).toBeNull();
    });

    it('should process multiple transactions correctly', () => {
        const mockSignatures = [
            {
                blockTime: 1234567890,
                confirmationStatus: 'finalized' as const,
                err: null,
                memo: null,
                signature: 'signature1',
                slot: 100,
            },
            {
                blockTime: 1234567891,
                confirmationStatus: 'finalized' as const,
                err: { InstructionError: [0, 'Custom error'] },
                memo: null,
                signature: 'signature2',
                slot: 101,
            },
            {
                blockTime: 1234567892,
                confirmationStatus: 'finalized' as const,
                err: null,
                memo: null,
                signature: 'signature3',
                slot: 102,
            },
        ];

        const result = getTransactionRows(mockSignatures);

        expect(result).toHaveLength(3);
        expect(result[0].statusClass).toBe('success');
        expect(result[1].statusClass).toBe('warning');
        expect(result[2].statusClass).toBe('success');
    });

    it('should group transactions by slot', () => {
        const mockSignatures = [
            {
                blockTime: 1234567890,
                confirmationStatus: 'finalized' as const,
                err: null,
                memo: null,
                signature: 'signature1',
                slot: 100,
            },
            {
                blockTime: 1234567890,
                confirmationStatus: 'finalized' as const,
                err: { InstructionError: [0, 'Custom error'] },
                memo: null,
                signature: 'signature2',
                slot: 100,
            },
        ];

        const result = getTransactionRows(mockSignatures);

        expect(result).toHaveLength(2);
        expect(result[0].slot).toBe(100);
        expect(result[1].slot).toBe(100);
    });
});
