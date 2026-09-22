import { createNextjsParameters, withCluster } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { displayTimestampUtc, unixTimestampToMs } from '@utils/date';

import { Signature } from '@/app/components/common/Signature';
import { Slot } from '@/app/components/common/Slot';
import { Badge } from '@/app/components/shared/ui/badge';
import { cn } from '@/app/components/shared/utils';
import { DataListRow } from '@/app/shared/ui/DataListCard';
import { ROW_PADDING } from '@/app/shared/ui/spacing';

import {
    BaseTransactionHistoryCard,
    historyGridCols,
    STATUS_BADGE,
    type TransactionHistoryRowView,
} from '../BaseTransactionHistoryCard';
import { InstructionList } from '../InstructionList';

const SIGNATURES = {
    failed: '5YtADoExampleHistoryCardSignaturePlaceholderForStoriesLJatMabcdefghijkmn',
    first: '2JgaFoExampleHistoryCardSignaturePlaceholderForStoriesZBbGUabcdefghijkmnop',
    third: 'dbaW9oExampleHistoryCardSignaturePlaceholderForStoriesfa3ewabcdefghijkmnopq',
};

function makeRow(
    overrides: Partial<TransactionHistoryRowView> & Pick<TransactionHistoryRowView, 'signature'>,
): TransactionHistoryRowView {
    return {
        blockTime: undefined,
        slot: 312_456_789,
        status: 'success',
        ...overrides,
    };
}

// A simplified row renderer for the story — the pure card owns the shell (external
// header + filter slot + refresh + table head + footer); the container owns the row.
// Real InstructionList keeps the programs cell representative without clipboard/download wiring.
function renderRow(row: TransactionHistoryRowView, hasTimestamps: boolean) {
    const badge = STATUS_BADGE[row.status];
    const signatureLink = <Signature signature={row.signature} link />;
    const statusBadge = (
        <Badge ui="dashkit" tone="soft" variant={badge.variant}>
            {badge.label}
        </Badge>
    );
    const programs = <InstructionList instructions={[{ name: 'Transfer', programName: 'System' }]} />;
    return (
        <DataListRow key={row.signature}>
            <div className={cn('flex flex-col gap-1 text-sm lg:hidden', ROW_PADDING)}>
                <div className="flex min-w-0 items-start gap-2">
                    <span className="min-w-0">{signatureLink}</span>
                    {statusBadge}
                </div>
                <div>{programs}</div>
            </div>

            <div className={cn('hidden items-baseline gap-4 lg:grid', ROW_PADDING, historyGridCols(hasTimestamps))}>
                <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                        <span className="min-w-0 text-sm">{signatureLink}</span>
                        {statusBadge}
                    </div>
                    <div className="mt-1">{programs}</div>
                </div>
                {hasTimestamps && (
                    <div className="text-outer-space-300">
                        {row.blockTime ? displayTimestampUtc(unixTimestampToMs(row.blockTime), true) : '---'}
                    </div>
                )}
                <div>
                    <Slot slot={row.slot} link />
                </div>
                <div>
                    <span className="text-dk-gray-700">Raw</span>
                </div>
            </div>
        </DataListRow>
    );
}

const meta = {
    component: BaseTransactionHistoryCard,
    decorators: [withCluster],
    parameters: createNextjsParameters(),
    tags: ['autodocs', 'test'],
    title: 'Features/TransactionHistory/TransactionHistoryCard',
} satisfies Meta<typeof BaseTransactionHistoryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyHistory: Story = {
    args: {
        fetching: false,
        foundOldest: true,
        onLoadMore: () => {},
        onRefresh: () => {},
        renderRow,
        rows: [],
    },
};

// No block times → the Time column is omitted. Includes a failed row to exercise the badge.
export const WithSignatures: Story = {
    args: {
        fetching: false,
        foundOldest: false,
        onLoadMore: () => {},
        onRefresh: () => {},
        renderRow,
        rows: [
            makeRow({ signature: SIGNATURES.first, slot: 312_456_789 }),
            makeRow({ signature: SIGNATURES.failed, slot: 312_456_790, status: 'failed' }),
            makeRow({ signature: SIGNATURES.third, slot: 312_456_791 }),
        ],
    },
};

// At least one row with a block time → the Time column appears.
export const WithTimestamps: Story = {
    args: {
        fetching: false,
        foundOldest: false,
        onLoadMore: () => {},
        onRefresh: () => {},
        renderRow,
        rows: [
            makeRow({ blockTime: 1_718_000_000, signature: SIGNATURES.first, slot: 312_456_789 }),
            makeRow({ blockTime: 1_718_000_500, signature: SIGNATURES.third, slot: 312_456_790 }),
        ],
    },
};

export const Fetching: Story = {
    args: {
        fetching: true,
        foundOldest: false,
        onLoadMore: () => {},
        onRefresh: () => {},
        renderRow,
        rows: [makeRow({ signature: SIGNATURES.first })],
    },
};
