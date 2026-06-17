import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { nextjsParameters } from '@storybook-config/decorators';

import {
    DEFAULT_SIGNATURE,
    MOCK_FAILED_STATUS,
    MOCK_FAILED_TX,
    MOCK_PARSED_TX,
    MOCK_STATUS,
} from '../__fixtures__/transaction';
import { withTransactionProviders } from '../__fixtures__/withTransactionProviders';
import { AccountsCard } from '../AccountsCard';

const meta: Meta<typeof AccountsCard> = {
    args: {
        signature: DEFAULT_SIGNATURE,
    },
    component: AccountsCard,
    parameters: {
        ...nextjsParameters,
    },
    tags: ['autodocs', 'test'],
    title: 'Features/Transaction/AccountsCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithAccounts: Story = {
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

export const FailedTransaction: Story = {
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

export const NoTransaction: Story = {
    decorators: [
        Story => {
            const Wrapper = withTransactionProviders({}, {});
            return (
                <Wrapper>
                    <Story />
                </Wrapper>
            );
        },
    ],
};
