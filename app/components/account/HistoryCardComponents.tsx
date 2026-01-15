import { ConfirmedSignatureInfo, TransactionError } from '@solana/web3.js';
import React from 'react';
import { Eye, EyeOff, RefreshCw } from 'react-feather';

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
    refresh,
    fetching,
    hideFailedTxs,
    onToggleHideFailedTxs,
}: {
    title: string;
    refresh: () => void;
    fetching: boolean;
    hideFailedTxs?: boolean;
    onToggleHideFailedTxs?: (value: boolean) => void;
}) {
    return (
        <div className="card-header align-items-center">
            <h3 className="card-header-title">{title}</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
                {hideFailedTxs !== undefined && onToggleHideFailedTxs && (
                    <button
                        className="btn btn-white btn-sm"
                        disabled={fetching}
                        onClick={() => onToggleHideFailedTxs(!hideFailedTxs)}
                    >
                        {hideFailedTxs ? (
                            <>
                                <Eye className="align-text-top me-2" size={13} />
                                Show All
                            </>
                        ) : (
                            <>
                                <EyeOff className="align-text-top me-2" size={13} />
                                Hide Failed
                            </>
                        )}
                    </button>
                )}
                <button className="btn btn-white btn-sm" disabled={fetching} onClick={() => refresh()}>
                    {fetching ? (
                        <>
                            <span className="align-text-top spinner-grow spinner-grow-sm me-2"></span>
                            Loading
                        </>
                    ) : (
                        <>
                            <RefreshCw className="align-text-top me-2" size={13} />
                            Refresh
                        </>
                    )}
                </button>
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
