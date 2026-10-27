import type { Meta, StoryObj } from '@storybook-config/types';

import {
    DEFAULT_SIGNATURE,
    MOCK_FAILED_STATUS,
    MOCK_FAILED_TX,
    MOCK_PARSED_TX,
    MOCK_STATUS,
} from '../__fixtures__/transaction';
import { withTransaction } from '../__fixtures__/withTransactionProviders';
import { InstructionsSection } from '../InstructionsSection';

const meta: Meta<typeof InstructionsSection> = {
    args: {
        signature: DEFAULT_SIGNATURE,
    },
    component: InstructionsSection,
    tags: ['autodocs', 'test'],
    title: 'Features/Transaction/InstructionsSection',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SystemTransfer: Story = {
    decorators: [withTransaction({ [DEFAULT_SIGNATURE]: MOCK_PARSED_TX }, { [DEFAULT_SIGNATURE]: MOCK_STATUS })],
};

export const FailedTransaction: Story = {
    decorators: [withTransaction({ [DEFAULT_SIGNATURE]: MOCK_FAILED_TX }, { [DEFAULT_SIGNATURE]: MOCK_FAILED_STATUS })],
};

export const NoDetails: Story = {
    decorators: [withTransaction({}, { [DEFAULT_SIGNATURE]: MOCK_STATUS })],
};
