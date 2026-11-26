import ScaledUiAmountMultiplierTooltip from '@components/account/token-extensions/ScaledUiAmountMultiplierTooltip';
import { Address } from '@components/common/Address';
import { Signature } from '@components/common/Signature';
import { Badge } from '@components/shared/ui/badge';
import { RefreshButton } from '@components/shared/ui/refresh-button';
import { Skeleton } from '@components/shared/ui/skeleton';
import { Timestamp } from '@components/shared/ui/timestamp';
import type { ScaledUiAmountMultiplier } from '@providers/accounts/tokens';
import { HistoryCardFooterContent } from '@shared/ui/HistoryCard';
import type { PublicKey } from '@solana/web3.js';

import { GridTableCard, type GridTableColumn } from '@/app/shared/ui/grid-table';

export const TRANSFER_STATUS_BADGE = {
    failed: { label: 'Failed', variant: 'warning' },
    success: { label: 'Success', variant: 'success' },
} as const;

export type TransferStatus = keyof typeof TRANSFER_STATUS_BADGE;

export type TokenTransferRowView = {
    key: string;
    signature: string;
    blockTime: number | undefined;
    status: TransferStatus;
    source: PublicKey;
    destination: PublicKey;
    /** Amount after the mint's scaled UI amount multiplier. */
    amount: string;
    /** Amount before scaling, shown in the multiplier tooltip. */
    rawAmount: string;
    scaledUiAmountMultiplier: ScaledUiAmountMultiplier;
    /** Token symbol; `undefined` while the token info is still loading. */
    units: string | undefined;
};

export type BaseTokenTransfersCardProps = {
    rows: TokenTransferRowView[];
    fetching: boolean;
    failed?: boolean;
    foundOldest: boolean;
    onRefresh: () => void;
    onLoadMore: () => void;
};

// Column track: the signature takes the slack, Source and Destination split what's left (Address
// mid-truncates to fit), Time and Amount get fixed shares. Time's 240px floor keeps the full timestamp
// and its chevron on one line. The track drives the md+ grid; below md GridTable reflows each row into
// labelled fields (`mobile="stack"`).
const GRID_TEMPLATE = 'grid-cols-[minmax(0,1.2fr)_minmax(240px,18%)_minmax(0,1fr)_minmax(0,1fr)_minmax(120px,16%)]';
const GRID_TEMPLATE_NO_TIME = 'grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(120px,16%)]';

// The token transfers of a mint, as shown on the Transfers tab. Reuses GridTableCard (like the Domains
// and IDL tables): one table that reflows to labelled rows below md. The transaction status rides in the
// signature cell as a badge rather than a separate column, and Source/Destination are full Address links.
export function BaseTokenTransfersCard({
    rows,
    fetching,
    failed,
    foundOldest,
    onRefresh,
    onLoadMore,
}: BaseTokenTransfersCardProps) {
    const hasTimestamps = rows.some(row => row.blockTime);
    const isEmpty = rows.length === 0;

    const columns: GridTableColumn<TokenTransferRowView>[] = [
        {
            cell: { wrap: 'nowrap' },
            header: 'Transaction Signature',
            mobileLabel: 'Signature',
            render: row => {
                const badge = TRANSFER_STATUS_BADGE[row.status];
                return (
                    <div className="flex min-w-0 items-baseline gap-2">
                        <span className="min-w-0">
                            <Signature signature={row.signature} link />
                        </span>
                        <Badge tone="soft" variant={badge.variant}>
                            {badge.label}
                        </Badge>
                    </div>
                );
            },
        },
        {
            cell: { wrap: 'nowrap' },
            header: 'Source',
            render: row => <Address pubkey={row.source} link />,
        },
        {
            cell: { wrap: 'nowrap' },
            header: 'Destination',
            render: row => <Address pubkey={row.destination} link />,
        },
        {
            header: 'Amount',
            render: row => <TransferAmount row={row} />,
        },
    ];

    if (hasTimestamps) {
        columns.splice(1, 0, {
            cell: { wrap: 'nowrap' },
            header: 'Time',
            render: row =>
                row.blockTime ? (
                    <Timestamp unixTimestamp={row.blockTime} />
                ) : (
                    <span className="text-outer-space-300">---</span>
                ),
        });
    }

    return (
        <GridTableCard
            title="Token Transfers"
            collapsible={false}
            actions={
                <RefreshButton
                    analyticsSection="token_transfers_header"
                    onClick={onRefresh}
                    fetching={fetching}
                    failed={failed}
                />
            }
            ariaLabel="Token transfers"
            columns={columns}
            rows={rows}
            getRowKey={row => row.key}
            gridTemplate={hasTimestamps ? GRID_TEMPLATE : GRID_TEMPLATE_NO_TIME}
            mobile="stack"
            empty="No transfers found"
            footer={
                isEmpty ? undefined : (
                    <div className="mt-2 w-full">
                        <HistoryCardFooterContent fetching={fetching} foundOldest={foundOldest} loadMore={onLoadMore} />
                    </div>
                )
            }
        />
    );
}

function TransferAmount({ row }: { row: TokenTransferRowView }) {
    return (
        <div className="flex flex-wrap items-baseline gap-x-1">
            <span>{row.amount}</span>
            {row.units === undefined ? (
                // Holds the symbol's place while the token info loads, so the amount doesn't shift once it
                // arrives.
                <Skeleton aria-hidden className="h-3 w-10 self-center" />
            ) : (
                <span>{row.units}</span>
            )}
            <ScaledUiAmountMultiplierTooltip
                rawAmount={row.rawAmount}
                scaledUiAmountMultiplier={row.scaledUiAmountMultiplier}
            />
        </div>
    );
}
