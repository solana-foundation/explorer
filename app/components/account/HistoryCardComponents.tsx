import { RefreshButton } from '@shared/ui/refresh-button';
import { ConfirmedSignatureInfo, TransactionError } from '@solana/web3.js';
import React from 'react';

export type TransactionRow = {
    slot: number;
    signature: string;
    err: TransactionError | null;
    blockTime: number | null | undefined;
    statusClass: string;
    statusText: string;
    signatureInfo: ConfirmedSignatureInfo;
};

export function HistoryCardHeader({
    title,
    analyticsSection,
    refresh,
    fetching,
    actions,
    subHeader,
}: {
    title: string;
    analyticsSection: string;
    refresh: () => void;
    fetching: boolean;
    actions?: React.ReactNode;
    subHeader?: React.ReactNode;
}) {
    return (
        <div className="card-header h-auto py-3" style={{ minHeight: '3.5rem' }}>
            <div className="d-flex flex-column gap-2 w-100">
                <div className="d-flex align-items-center gap-2">
                    <h3 className="card-header-title mb-0 me-auto">{title}</h3>
                    <div className="d-flex align-items-center gap-2">
                        {actions}
                        <RefreshButton analyticsSection={analyticsSection} onClick={refresh} fetching={fetching} />
                    </div>
                </div>
                {subHeader && <div className="d-flex flex-wrap gap-2">{subHeader}</div>}
            </div>
        </div>
    );
}

export function HistoryCardFooter({
    fetching,
    foundOldest,
    loadMore,
}: {
    fetching: boolean;
    foundOldest: boolean;
    loadMore: () => void;
}) {
    return (
        <div className="card-footer">
            {foundOldest ? (
                <div className="text-muted text-center">Fetched full history</div>
            ) : (
                <button className="btn btn-primary w-100" onClick={() => loadMore()} disabled={fetching}>
                    {fetching ? (
                        <>
                            <span className="align-text-top spinner-grow spinner-grow-sm me-2"></span>
                            Loading
                        </>
                    ) : (
                        'Load More'
                    )}
                </button>
            )}
        </div>
    );
}

export function getTransactionRows(transactions: ConfirmedSignatureInfo[]): TransactionRow[] {
    const transactionRows: TransactionRow[] = [];
    for (let i = 0; i < transactions.length; i++) {
        const slot = transactions[i].slot;
        const slotTransactions = [transactions[i]];
        while (i + 1 < transactions.length) {
            const nextSlot = transactions[i + 1].slot;
            if (nextSlot !== slot) break;
            slotTransactions.push(transactions[++i]);
        }

        for (const slotTransaction of slotTransactions) {
            let statusText;
            let statusClass;
            if (slotTransaction.err) {
                statusClass = 'warning';
                statusText = 'Failed';
            } else {
                statusClass = 'success';
                statusText = 'Success';
            }
            transactionRows.push({
                blockTime: slotTransaction.blockTime,
                err: slotTransaction.err,
                signature: slotTransaction.signature,
                signatureInfo: slotTransaction,
                slot,
                statusClass,
                statusText,
            });
        }
    }

    return transactionRows;
}
