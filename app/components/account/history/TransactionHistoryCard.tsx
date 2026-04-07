'use client';

import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { Signature } from '@components/common/Signature';
import { Slot } from '@components/common/Slot';
import { useAccountHistory, useFetchAccountHistory, useFetchTransactionsForHistory } from '@providers/accounts/history';
import { FetchStatus } from '@providers/cache';
import { ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';
import { displayTimestampUtc } from '@utils/date';
import { getTransactionInstructionNames } from '@utils/instruction';
import React, { useCallback, useMemo } from 'react';
import Moment from 'react-moment';

import { useFetchRawTransaction, useRawTransactionDetails } from '@/app/providers/transactions/raw';
import { DownloadDropdown } from '@/app/shared/components/DownloadDropdown';
import { toBase64 } from '@/app/shared/lib/bytes';

import { Copyable } from '../../common/Copyable';
import { getTransactionRows, HistoryCardFooter, HistoryCardHeader } from '../HistoryCardComponents';

export function TransactionHistoryCard({ address }: { address: string }) {
    const pubkey = useMemo(() => new PublicKey(address), [address]);
    const history = useAccountHistory(address);
    const fetchAccountHistory = useFetchAccountHistory();
    const fetchTransactionsForHistory = useFetchTransactionsForHistory();
    const refresh = () => fetchAccountHistory(pubkey, false, true);
    const loadMore = () => fetchAccountHistory(pubkey, false);

    React.useEffect(() => {
        if (history?.data) {
            fetchTransactionsForHistory(pubkey, history.data);
        }
    }, [history?.data, fetchTransactionsForHistory, pubkey]);

    const transactionRows = React.useMemo(() => {
        if (history?.data?.fetched) {
            return getTransactionRows(history.data.fetched);
        }
        return [];
    }, [history]);

    const detailedHistoryMap = React.useMemo(
        () => history?.data?.transactionMap || new Map<string, ParsedTransactionWithMeta>(),
        [history?.data?.transactionMap],
    );

    React.useEffect(() => {
        if (!history) {
            refresh();
        }
    }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!history) {
        return null;
    }

    if (history?.data === undefined) {
        if (history.status === FetchStatus.Fetching) {
            return <LoadingCard message="Loading history" />;
        }

        return <ErrorCard retry={refresh} text="Failed to fetch transaction history" />;
    }

    const hasTimestamps = transactionRows.some(element => element.blockTime);
    const detailsList: React.ReactNode[] = transactionRows.map(
        ({ slot, signature, blockTime, statusClass, statusText }) => {
            const transactionWithMeta = detailedHistoryMap.get(signature);
            const instructionNames = transactionWithMeta ? getTransactionInstructionNames(transactionWithMeta) : null;

            return (
                <tr key={signature}>
                    <td>
                        <Signature signature={signature} link truncateChars={40} />
                        {instructionNames && instructionNames.length > 0 && (
                            <div className="d-flex flex-wrap gap-1 mt-1">
                                {instructionNames.map((name, i) => (
                                    <span key={i} className="badge bg-secondary-soft">
                                        {name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </td>

                    <td className="w-1">
                        <Slot slot={slot} link />
                    </td>

                    {hasTimestamps && (
                        <>
                            <td className="text-muted">
                                {blockTime ? <Moment date={blockTime * 1000} fromNow /> : '---'}
                            </td>
                            <td className="text-muted">
                                {blockTime ? displayTimestampUtc(blockTime * 1000, true) : '---'}
                            </td>
                        </>
                    )}

                    <td>
                        <span className={`badge bg-${statusClass}-soft`}>{statusText}</span>
                    </td>
                    <td>
                        <TransactionRawDataDownloadField signature={signature} />
                    </td>
                </tr>
            );
        },
    );

    const fetching = history.status === FetchStatus.Fetching;
    return (
        <div className="card">
            <HistoryCardHeader
                fetching={fetching}
                refresh={() => refresh()}
                title="Transaction History"
                analyticsSection="transaction_history_header"
            />
            <div className="table-responsive mb-0">
                <table className="table table-sm table-nowrap card-table">
                    <thead>
                        <tr>
                            <th className="text-muted w-1">Transaction Signature</th>
                            <th className="text-muted w-1">Block</th>
                            {hasTimestamps && (
                                <>
                                    <th className="text-muted w-1">Age</th>
                                    <th className="text-muted w-1">Timestamp</th>
                                </>
                            )}
                            <th className="text-muted">Result</th>
                            <th className="text-muted">Raw Data</th>
                        </tr>
                    </thead>
                    <tbody className="list">{detailsList}</tbody>
                </table>
            </div>
            <HistoryCardFooter fetching={fetching} foundOldest={history.data.foundOldest} loadMore={() => loadMore()} />
        </div>
    );
}

function TransactionRawDataDownloadField({ signature }: { signature: string }) {
    const fetchRaw = useFetchRawTransaction();
    const rawDetails = useRawTransactionDetails(signature);
    const serialized = rawDetails?.data?.raw?.message.serialize();
    const transactionData = useMemo(() => serialized && new Uint8Array(serialized), [serialized]);
    const loading = rawDetails?.status === FetchStatus.Fetching;

    const handleHover = useCallback(() => {
        if (!transactionData) {
            fetchRaw(signature);
        }
    }, [transactionData, signature, fetchRaw]);

    return (
        <div className="d-flex align-items-center gap-1" onMouseEnter={handleHover}>
            <Copyable text={transactionData ? toBase64(transactionData) : null}>
                <DownloadDropdown data={transactionData} loading={loading} filename={signature} />
            </Copyable>
        </div>
    );
}
