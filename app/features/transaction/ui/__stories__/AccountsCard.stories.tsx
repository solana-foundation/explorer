import type { Meta, StoryObj } from '@storybook-config/types';

import {
    DEFAULT_SIGNATURE,
    MOCK_FAILED_STATUS,
    MOCK_FAILED_TX,
    MOCK_PARSED_TX,
    MOCK_STATUS,
} from '../__fixtures__/transaction';
import { withTransaction } from '../__fixtures__/withTransactionProviders';
import { AccountsCard } from '../AccountsCard';

const meta: Meta<typeof AccountsCard> = {
    args: {
        signature: DEFAULT_SIGNATURE,
    },
    component: AccountsCard,
    tags: ['autodocs', 'test'],
    title: 'Features/Transaction/AccountsCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithAccounts: Story = {
    decorators: [withTransaction({ [DEFAULT_SIGNATURE]: MOCK_PARSED_TX }, { [DEFAULT_SIGNATURE]: MOCK_STATUS })],
};

export const FailedTransaction: Story = {
    decorators: [withTransaction({ [DEFAULT_SIGNATURE]: MOCK_FAILED_TX }, { [DEFAULT_SIGNATURE]: MOCK_FAILED_STATUS })],
};

export const NoTransaction: Story = {
    decorators: [withTransaction({}, {})],
};
