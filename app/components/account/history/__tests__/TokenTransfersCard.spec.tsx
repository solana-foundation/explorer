import { gen } from '@__fixtures__/gen';
import { screen, within } from '@testing-library/react';
import { displayTimestampAbsolute, unixTimestampToMs } from '@utils/date';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/app/__tests__/card-harness';

import { BaseTokenTransfersCard, type TokenTransferRowView } from '../BaseTokenTransfersCard';

vi.mock('next/navigation', () => import('@/app/__tests__/next-navigation'));

// GridTable renders the grid and the mobile stack as two trees (one is CSS-hidden per breakpoint), so
// row content appears twice in the DOM. Scope assertions to the first (desktop grid) table to count once.
function desktopTable() {
    return screen.getAllByRole('table', { name: 'Token transfers' })[0];
}

describe('BaseTokenTransfersCard', () => {
    it('should show the empty state once the full history holds no transfers', () => {
        renderCard({ foundOldest: true, rows: [] });

        expect(within(desktopTable()).getByText('No transfers found')).toBeInTheDocument();
        // No Load More / "Fetched full history" footer in the empty card.
        expect(screen.queryByText('Fetched full history')).not.toBeInTheDocument();
        expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });

    it('should show a dash in the Time cell of a row without a block time', () => {
        renderCard({
            rows: [row({ blockTime: BLOCK_TIME, key: 'timed' }), row({ blockTime: undefined, key: 'untimed' })],
        });

        const table = within(desktopTable());
        expect(table.getByText('Time')).toBeInTheDocument();
        expect(table.getByText(BLOCK_TIME_UTC)).toBeInTheDocument();
        expect(table.getByText('---')).toBeInTheDocument();
    });

    it('should leave out the Time column when no row has a block time', () => {
        renderCard({ rows: [row({ blockTime: undefined })] });

        const table = within(desktopTable());
        expect(table.queryByText('Time')).not.toBeInTheDocument();
        expect(table.queryByText('---')).not.toBeInTheDocument();
    });

    it('should mark a failed transfer with a Failed badge', () => {
        renderCard({ rows: [row({ status: 'failed' })] });

        const table = within(desktopTable());
        expect(table.getByText('Failed')).toBeInTheDocument();
        expect(table.queryByText('Success')).not.toBeInTheDocument();
    });

    it('should show the amount without a symbol while the token info loads', () => {
        renderCard({ rows: [row({ amount: '12.5', units: undefined })] });

        const table = within(desktopTable());
        expect(table.getByText('12.5')).toBeInTheDocument();
        expect(table.queryByText('USDC')).not.toBeInTheDocument();
        expect(table.queryByText('Tokens')).not.toBeInTheDocument();
    });
});

const BLOCK_TIME = 1_718_000_000;
const BLOCK_TIME_UTC = displayTimestampAbsolute(unixTimestampToMs(BLOCK_TIME), true);

function renderCard({ rows, foundOldest = false }: { rows: TokenTransferRowView[]; foundOldest?: boolean }) {
    return renderWithProviders(
        <BaseTokenTransfersCard
            rows={rows}
            fetching={false}
            foundOldest={foundOldest}
            onRefresh={() => {}}
            onLoadMore={() => {}}
        />,
        { transactions: false },
    );
}

function row(overrides: Partial<TokenTransferRowView> = {}): TokenTransferRowView {
    return {
        amount: '1.000000',
        blockTime: undefined,
        destination: gen.publicKey(2),
        key: 'row',
        rawAmount: '1.000000',
        scaledUiAmountMultiplier: { multiplier: '1', status: 'known' },
        signature: gen.signature(1),
        source: gen.publicKey(1),
        status: 'success',
        units: 'USDC',
        ...overrides,
    };
}
