'use client';

import { getTransactionRows, HistoryCardFooter, HistoryCardHeader } from '@components/account/HistoryCardComponents';
import { Copyable } from '@components/common/Copyable';
import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { Signature } from '@components/common/Signature';
import { Slot } from '@components/common/Slot';
import { useAccountHistory, useFetchAccountHistory } from '@providers/accounts/history';
import { FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';
import { displayTimestampUtc } from '@utils/date';
import React, { useCallback, useMemo } from 'react';

import { Badge } from '@/app/components/shared/ui/badge';
import { useFetchRawTransaction, useRawTransactionDetails } from '@/app/providers/transactions/raw';
import { DownloadDropdown } from '@/app/shared/components/DownloadDropdown';
import { toBase64 } from '@/app/shared/lib/bytes';
import { RelativeTime } from '@/app/shared/RelativeTime';
import { Card } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

import { useInstructionNames } from '../lib/use-instruction-names';
import { InstructionList, InstructionListSkeleton } from './InstructionList';

export function TransactionHistoryCard({ address }: { address: string }) {
    const pubkey = useMemo(() => new PublicKey(address), [address]);
    const history = useAccountHistory(address);
    const fetchAccountHistory = useFetchAccountHistory();
    const refresh = () => fetchAccountHistory(pubkey, false, true);
    const loadMore = () => fetchAccountHistory(pubkey, false);

    const transactionRows = React.useMemo(() => {
        if (history?.data?.fetched) {
            return getTransactionRows(history.data.fetched);
        }
        return [];
    }, [history]);

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
        ({ slot, signature, blockTime, statusClass, statusText }) => (
            <TransactionRow
                key={signature}
                signature={signature}
                slot={slot}
                blockTime={blockTime}
                statusClass={statusClass}
                statusText={statusText}
                hasTimestamps={hasTimestamps}
            />
        ),
    );

    const fetching = history.status === FetchStatus.Fetching;
    return (
        <Card ui="dashkit">
            <HistoryCardHeader
                fetching={fetching}
                refresh={() => refresh()}
                title="Transaction History"
                analyticsSection="transaction_history_header"
            />
            <BaseTable ui="dashkit" variant="card" nowrap>
                <BaseTable.Head>
                    <BaseTable.Row>
                        <BaseTable.HeaderCell className="text-muted e-w-[1%]">
                            Transaction Signature
                        </BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-muted e-w-[1%]">Block</BaseTable.HeaderCell>
                        {hasTimestamps && (
                            <>
                                <BaseTable.HeaderCell className="text-muted e-w-[1%]">Age</BaseTable.HeaderCell>
                                <BaseTable.HeaderCell className="text-muted e-w-[1%]">Timestamp</BaseTable.HeaderCell>
                            </>
                        )}
                        <BaseTable.HeaderCell className="text-muted">Result</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-muted">Raw Data</BaseTable.HeaderCell>
                    </BaseTable.Row>
                </BaseTable.Head>
                <BaseTable.Body className="list">{detailsList}</BaseTable.Body>
            </BaseTable>
            <HistoryCardFooter fetching={fetching} foundOldest={history.data.foundOldest} loadMore={() => loadMore()} />
        </Card>
    );
}

type TransactionRowProps = {
    signature: string;
    slot: number;
    blockTime: number | null | undefined;
    statusClass: string;
    statusText: string;
    hasTimestamps: boolean;
};

function TransactionRow({ signature, slot, blockTime, statusClass, statusText, hasTimestamps }: TransactionRowProps) {
    const instructionNames = useInstructionNames(signature);

    return (
        <BaseTable.Row>
            <BaseTable.Cell>
                <Signature signature={signature} link />
                {instructionNames !== null && instructionNames.length > 0 ? (
                    <InstructionList instructions={instructionNames} />
                ) : instructionNames === null ? (
                    <InstructionListSkeleton />
                ) : null}
            </BaseTable.Cell>

            <BaseTable.Cell className="e-w-[1%]">
                <Slot slot={slot} link />
            </BaseTable.Cell>

            {hasTimestamps && (
                <>
                    <BaseTable.Cell className="text-muted">
                        {blockTime ? <RelativeTime date={blockTime * 1000} /> : '---'}
                    </BaseTable.Cell>
                    <BaseTable.Cell className="text-muted">
                        {blockTime ? displayTimestampUtc(blockTime * 1000, true) : '---'}
                    </BaseTable.Cell>
                </>
            )}

            <BaseTable.Cell>
                <Badge ui="dashkit" variant={statusClass as 'success' | 'warning'}>
                    {statusText}
                </Badge>
            </BaseTable.Cell>
            <BaseTable.Cell>
                <TransactionRawDataDownloadField signature={signature} />
            </BaseTable.Cell>
        </BaseTable.Row>
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
        <div className="e-flex e-items-center e-gap-[3px]" onMouseEnter={handleHover}>
            <Copyable text={transactionData ? toBase64(transactionData) : null}>
                <DownloadDropdown data={transactionData} loading={loading} filename={signature} />
            </Copyable>
        </div>
    );
}
