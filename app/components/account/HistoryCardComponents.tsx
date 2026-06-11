import { Button } from '@shared/ui/button';
import { RefreshButton } from '@shared/ui/refresh-button';
import { ConfirmedSignatureInfo, TransactionError } from '@solana/web3.js';
import React from 'react';

import { CardFooter, CardHeader, CardTitle } from '@/app/shared/ui/Card';

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
}: {
    title: string;
    analyticsSection: string;
    refresh: () => void;
    fetching: boolean;
}) {
    return (
        <CardHeader ui="dashkit">
            <CardTitle as="h3" ui="dashkit">
                {title}
            </CardTitle>
            <RefreshButton analyticsSection={analyticsSection} onClick={refresh} fetching={fetching} />
        </CardHeader>
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
        <CardFooter ui="dashkit">
            {foundOldest ? (
                <div className="e-text-center e-text-dk-gray-700">Fetched full history</div>
            ) : (
                <Button
                    ui="dashkit"
                    variant="primary"
                    className="e-w-full"
                    onClick={() => loadMore()}
                    disabled={fetching}
                >
                    {fetching ? (
                        <>
                            <span className="e-spinner-grow e-spinner-grow-sm e-mr-1.5 e-align-text-top"></span>
                            Loading
                        </>
                    ) : (
                        'Load More'
                    )}
                </Button>
            )}
        </CardFooter>
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
