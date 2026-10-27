import { mockTransactionStatus } from '@storybook-config/__fixtures__/transactions';
import type { Meta, StoryObj } from '@storybook-config/types';

import { AutoRefresh } from '@/app/shared/lib/use-auto-refresh';

import {
    DEFAULT_SIGNATURE,
    MOCK_FAILED_STATUS,
    MOCK_FAILED_TX,
    MOCK_LOOSE_BUDGET_TX,
    MOCK_PARSED_TX,
    MOCK_PARSED_TX_NO_BLOCK_TIME,
    MOCK_RAW_TX,
    MOCK_RAW_TX_NO_BLOCK_TIME,
    MOCK_STATUS,
} from '../__fixtures__/transaction';
import { withTransaction } from '../__fixtures__/withTransactionProviders';
import { SummaryCard } from '../SummaryCard';

const meta: Meta<typeof SummaryCard> = {
    args: {
        autoRefresh: AutoRefresh.Inactive,
        signature: DEFAULT_SIGNATURE,
    },
    component: SummaryCard,
    tags: ['autodocs', 'test'],
    title: 'Features/Transaction/SummaryCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Finalized: Story = {
    decorators: [
        withTransaction(
            { [DEFAULT_SIGNATURE]: MOCK_PARSED_TX },
            { [DEFAULT_SIGNATURE]: MOCK_STATUS },
            { [DEFAULT_SIGNATURE]: MOCK_RAW_TX },
        ),
    ],
};

export const Confirming: Story = {
    args: {
        autoRefresh: AutoRefresh.Active,
    },
    decorators: [
        withTransaction(
            { [DEFAULT_SIGNATURE]: MOCK_PARSED_TX },
            { [DEFAULT_SIGNATURE]: mockTransactionStatus({ confirmationStatus: 'confirmed', confirmations: 10 }) },
        ),
    ],
};

export const Failed: Story = {
    decorators: [withTransaction({ [DEFAULT_SIGNATURE]: MOCK_FAILED_TX }, { [DEFAULT_SIGNATURE]: MOCK_FAILED_STATUS })],
};

export const NoTimestamp: Story = {
    decorators: [
        withTransaction(
            { [DEFAULT_SIGNATURE]: MOCK_PARSED_TX_NO_BLOCK_TIME },
            { [DEFAULT_SIGNATURE]: mockTransactionStatus() },
            { [DEFAULT_SIGNATURE]: MOCK_RAW_TX_NO_BLOCK_TIME },
        ),
    ],
};

/**
 * A 200,000 compute unit request over a transfer that uses 150, where every staged SIMD-0553 rate
 * costs more than the flat base fee.
 *
 * The fee projection row needs `NEXT_PUBLIC_SIMD_0553_FEE_ENABLED=true` in the environment
 * Storybook was built with; without it this renders as the plain finalized card.
 */
export const LooseComputeBudget: Story = {
    decorators: [
        withTransaction(
            { [DEFAULT_SIGNATURE]: MOCK_LOOSE_BUDGET_TX },
            { [DEFAULT_SIGNATURE]: MOCK_STATUS },
            { [DEFAULT_SIGNATURE]: MOCK_RAW_TX },
        ),
    ],
};
