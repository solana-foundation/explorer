'use client';

import { Signature } from '@components/common/Signature';
import { Slot } from '@components/common/Slot';
import { HistoryCardFooter, HistoryCardHeader } from '@shared/ui/HistoryCard';
import { displayTimestampUtc, unixTimestampToMs } from '@utils/date';
import { type ReactNode } from 'react';

import { Badge } from '@/app/components/shared/ui/badge';
import { RelativeTime } from '@/app/shared/RelativeTime';
import { Card } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

export type TransactionHistoryRowView = {
    signature: string;
    slot: number;
    blockTime: number | null | undefined;
    status: 'success' | 'failed';
    // Cells whose content needs per-row hooks (lazy, on-visible / on-hover fetching), injected by the
    // container so this card stays pure.
    instructionsCell: ReactNode;
    rawDataCell: ReactNode;
};

export type BaseTransactionHistoryCardProps = {
    rows: TransactionHistoryRowView[];
    fetching: boolean;
    foundOldest: boolean;
    onRefresh: () => void;
    onLoadMore: () => void;
};

export function BaseTransactionHistoryCard({
    rows,
    fetching,
    foundOldest,
    onRefresh,
    onLoadMore,
}: BaseTransactionHistoryCardProps) {
    const hasTimestamps = rows.some(row => row.blockTime);

    return (
        <Card ui="dashkit">
            <HistoryCardHeader
                title="Transaction History"
                analyticsSection="transaction_history_header"
                refresh={onRefresh}
                fetching={fetching}
            />
            <BaseTable ui="dashkit" variant="card" nowrap>
                <BaseTable.Head>
                    <BaseTable.Row>
                        <BaseTable.HeaderCell className="w-px text-dk-gray-700">
                            Transaction Signature
                        </BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="w-px text-dk-gray-700">Block</BaseTable.HeaderCell>
                        {hasTimestamps && (
                            <>
                                <BaseTable.HeaderCell className="w-px text-dk-gray-700">Age</BaseTable.HeaderCell>
                                <BaseTable.HeaderCell className="w-px text-dk-gray-700">Timestamp</BaseTable.HeaderCell>
                            </>
                        )}
                        <BaseTable.HeaderCell className="text-dk-gray-700">Result</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-dk-gray-700">Raw Data</BaseTable.HeaderCell>
                    </BaseTable.Row>
                </BaseTable.Head>
                <BaseTable.Body>
                    {rows.map(row => (
                        <TransactionRow key={row.signature} row={row} hasTimestamps={hasTimestamps} />
                    ))}
                </BaseTable.Body>
            </BaseTable>
            <HistoryCardFooter fetching={fetching} foundOldest={foundOldest} loadMore={onLoadMore} />
        </Card>
    );
}

// Domain status → how the Result column renders it. The card owns this mapping so Badge's variant
// names ('warning' for a failed tx) never leak into the row's data model.
const STATUS_BADGE = {
    failed: { label: 'Failed', variant: 'warning' },
    success: { label: 'Success', variant: 'success' },
} as const;

function TransactionRow({
    row: { signature, slot, blockTime, status, instructionsCell, rawDataCell },
    hasTimestamps,
}: {
    row: TransactionHistoryRowView;
    hasTimestamps: boolean;
}) {
    return (
        <BaseTable.Row>
            <BaseTable.Cell>
                <Signature signature={signature} link />
                {instructionsCell}
            </BaseTable.Cell>

            <BaseTable.Cell className="w-px">
                <Slot slot={slot} link />
            </BaseTable.Cell>

            {hasTimestamps && (
                <>
                    <BaseTable.Cell className="text-dk-gray-700">
                        {blockTime ? <RelativeTime date={unixTimestampToMs(blockTime)} /> : '---'}
                    </BaseTable.Cell>
                    <BaseTable.Cell className="text-dk-gray-700">
                        {blockTime ? displayTimestampUtc(unixTimestampToMs(blockTime), true) : '---'}
                    </BaseTable.Cell>
                </>
            )}

            <BaseTable.Cell>
                <Badge ui="dashkit" variant={STATUS_BADGE[status].variant}>
                    {STATUS_BADGE[status].label}
                </Badge>
            </BaseTable.Cell>
            <BaseTable.Cell>{rawDataCell}</BaseTable.Cell>
        </BaseTable.Row>
    );
}
