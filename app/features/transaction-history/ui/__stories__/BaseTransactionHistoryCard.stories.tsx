import { createNextjsParameters, withCluster } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BaseTransactionHistoryCard, type TransactionHistoryRowView } from '../BaseTransactionHistoryCard';
import { InstructionList } from '../InstructionList';

const SIGNATURES = {
    failed: '5YtADoExampleHistoryCardSignaturePlaceholderForStoriesLJatMabcdefghijkmn',
    first: '2JgaFoExampleHistoryCardSignaturePlaceholderForStoriesZBbGUabcdefghijkmnop',
    third: 'dbaW9oExampleHistoryCardSignaturePlaceholderForStoriesfa3ewabcdefghijkmnopq',
};

// The instruction / raw-data cells are injected by the container in production; the pure card just
// renders whatever node it's handed. Real InstructionList keeps the story representative; a plain node
// stands in for the raw-data cell so the story stays free of clipboard/download wiring.
function makeRow(
    overrides: Partial<TransactionHistoryRowView> & Pick<TransactionHistoryRowView, 'signature'>,
): TransactionHistoryRowView {
    return {
        blockTime: undefined,
        instructionsCell: <InstructionList instructions={[{ name: 'Transfer', program: 'System' }]} />,
        rawDataCell: <span className="text-dk-gray-700">Raw</span>,
        slot: 312_456_789,
        status: 'success',
        ...overrides,
    };
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
        rows: [],
    },
};

// No block times → the Age / Timestamp columns are omitted. Includes a failed row to exercise the badge.
export const WithSignatures: Story = {
    args: {
        fetching: false,
        foundOldest: false,
        onLoadMore: () => {},
        onRefresh: () => {},
        rows: [
            makeRow({ signature: SIGNATURES.first, slot: 312_456_789 }),
            makeRow({ signature: SIGNATURES.failed, slot: 312_456_790, status: 'failed' }),
            makeRow({ signature: SIGNATURES.third, slot: 312_456_791 }),
        ],
    },
};

// At least one row with a block time → the Age / Timestamp columns appear.
export const WithTimestamps: Story = {
    args: {
        fetching: false,
        foundOldest: false,
        onLoadMore: () => {},
        onRefresh: () => {},
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
        rows: [makeRow({ signature: SIGNATURES.first })],
    },
};
