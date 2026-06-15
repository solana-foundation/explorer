import { mockTransactionStatus } from '@storybook-config/__fixtures__/transactions';
import { nextjsParameters } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { AutoRefresh } from '@utils/use-auto-refresh';

import {
    DEFAULT_SIGNATURE,
    MOCK_FAILED_STATUS,
    MOCK_FAILED_TX,
    MOCK_PARSED_TX,
    MOCK_STATUS,
} from '../__fixtures__/transaction';
import { withTransactionProviders } from '../__fixtures__/withTransactionProviders';
import { SummaryCard } from '../SummaryCard';

const meta: Meta<typeof SummaryCard> = {
    args: {
        autoRefresh: AutoRefresh.Inactive,
        signature: DEFAULT_SIGNATURE,
    },
    component: SummaryCard,
    parameters: {
        ...nextjsParameters,
    },
    tags: ['autodocs', 'test'],
    title: 'Features/Transaction/SummaryCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Finalized: Story = {
    decorators: [
        Story => {
            const Wrapper = withTransactionProviders(
                { [DEFAULT_SIGNATURE]: MOCK_PARSED_TX },
                { [DEFAULT_SIGNATURE]: MOCK_STATUS },
            );
            return (
                <Wrapper>
                    <Story />
                </Wrapper>
            );
        },
    ],
};

export const Confirming: Story = {
    args: {
        autoRefresh: AutoRefresh.Active,
    },
    decorators: [
        Story => {
            const Wrapper = withTransactionProviders(
                { [DEFAULT_SIGNATURE]: MOCK_PARSED_TX },
                {
                    [DEFAULT_SIGNATURE]: mockTransactionStatus({
                        confirmationStatus: 'confirmed',
                        confirmations: 10,
                    }),
                },
            );
            return (
                <Wrapper>
                    <Story />
                </Wrapper>
            );
        },
    ],
};

export const Failed: Story = {
    decorators: [
        Story => {
            const Wrapper = withTransactionProviders(
                { [DEFAULT_SIGNATURE]: MOCK_FAILED_TX },
                { [DEFAULT_SIGNATURE]: MOCK_FAILED_STATUS },
            );
            return (
                <Wrapper>
                    <Story />
                </Wrapper>
            );
        },
    ],
};

export const NoTimestamp: Story = {
    decorators: [
        Story => {
            const Wrapper = withTransactionProviders(
                { [DEFAULT_SIGNATURE]: MOCK_PARSED_TX },
                { [DEFAULT_SIGNATURE]: mockTransactionStatus({ timestamp: 'unavailable' }) },
            );
            return (
                <Wrapper>
                    <Story />
                </Wrapper>
            );
        },
    ],
};
