import type { TransactionWithMeta } from '@entities/transaction-data';
import type { MissingTransactions } from '@features/transaction-history/lib/types';
import { mockAccountHistory, mockConfirmedSignatureInfo } from '@storybook-config/__fixtures__/account-history';
import { MockAccountsProvider } from '@storybook-config/__mocks__/MockAccountsProvider';
import { MockClusterProvider } from '@storybook-config/__mocks__/MockClusterProvider';
import { MockHistoryProvider } from '@storybook-config/__mocks__/MockHistoryProvider';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TokenTransfersCard } from '../TokenTransfersCard';

const enableTransactionFetches = vi.hoisted(() => vi.fn());
const fetchAccountHistory = vi.hoisted(() => vi.fn());
const retryFailedTransactions = vi.hoisted(() => vi.fn());
vi.mock('@features/transaction-history/model/use-fetch-account-history', () => ({
    useEnableTransactionFetches: enableTransactionFetches,
    useFetchAccountHistory: () => fetchAccountHistory,
    useRetryFailedTransactions: () => retryFailedTransactions,
}));
vi.mock('@entities/token-info', () => ({ fetchTokenInfoFromApi: vi.fn(), getTokenInfoSwrKey: () => undefined }));

const ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

beforeEach(() => vi.clearAllMocks());

describe('TokenTransfersCard', () => {
    it('should count the rows whose fetch failed or was skipped, and retry their transactions without a refresh on Retry', async () => {
        const rows = [mockConfirmedSignatureInfo(), mockConfirmedSignatureInfo(), mockConfirmedSignatureInfo()];
        renderCard({
            fetched: rows,
            missingTransactions: new Map([
                [rows[0].signature, 'failed'],
                [rows[1].signature, 'skipped'],
            ]),
        });
        fetchAccountHistory.mockClear();

        expect(screen.getByText('Failed to load 2 of 3 transactions')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Retry the failed transactions' }));

        expect(retryFailedTransactions.mock.calls).toEqual([[ADDRESS]]);
        expect(fetchAccountHistory).not.toHaveBeenCalled();
    });

    it('should enable the transaction fetches of its address', () => {
        renderCard({ fetched: [mockConfirmedSignatureInfo()], missingTransactions: new Map() });

        expect(enableTransactionFetches).toHaveBeenCalledWith(ADDRESS);
    });

    it('should retry on mount, without a refresh, the transactions that a fetch skipped', () => {
        const rows = [mockConfirmedSignatureInfo()];

        renderCard({
            fetched: rows,
            missingTransactions: new Map([[rows[0].signature, 'skipped']]),
            transactionMap: new Map([['other', {} as TransactionWithMeta]]),
        });

        expect(retryFailedTransactions.mock.calls).toEqual([[ADDRESS]]);
        expect(fetchAccountHistory).not.toHaveBeenCalled();
    });

    it('should not retry or refresh on mount for a skipped signature that the history does not list', () => {
        renderCard({
            fetched: [mockConfirmedSignatureInfo()],
            missingTransactions: new Map([['unlisted', 'skipped']]),
            transactionMap: new Map([['other', {} as TransactionWithMeta]]),
        });

        expect(retryFailedTransactions).not.toHaveBeenCalled();
        expect(fetchAccountHistory).not.toHaveBeenCalled();
    });
});

function renderCard({
    fetched,
    missingTransactions,
    transactionMap,
}: {
    fetched: ReturnType<typeof mockConfirmedSignatureInfo>[];
    missingTransactions: MissingTransactions;
    transactionMap?: Map<string, TransactionWithMeta>;
}): void {
    render(
        <MockClusterProvider>
            <MockAccountsProvider>
                <MockHistoryProvider
                    history={{ [ADDRESS]: mockAccountHistory({ fetched, missingTransactions, transactionMap }) }}
                >
                    <TokenTransfersCard address={ADDRESS} />
                </MockHistoryProvider>
            </MockAccountsProvider>
        </MockClusterProvider>,
    );
}
