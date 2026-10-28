import type { Meta, StoryObj } from '@storybook-config/types';

import {
    DEFAULT_SIGNATURE,
    MOCK_FAILED_STATUS,
    MOCK_FAILED_TX,
    MOCK_NO_LOGS_TX,
    MOCK_PARSED_TX,
    MOCK_STATUS,
} from '../__fixtures__/transaction';
import { withTransaction } from '../__fixtures__/withTransactionProviders';
import { ProgramLogSection } from '../ProgramLogSection';

const meta: Meta<typeof ProgramLogSection> = {
    args: {
        signature: DEFAULT_SIGNATURE,
    },
    component: ProgramLogSection,
    tags: ['autodocs', 'test'],
    title: 'Features/Transaction/ProgramLogSection',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SuccessfulLogs: Story = {
    decorators: [withTransaction({ [DEFAULT_SIGNATURE]: MOCK_PARSED_TX }, { [DEFAULT_SIGNATURE]: MOCK_STATUS })],
};

export const FailedLogs: Story = {
    decorators: [withTransaction({ [DEFAULT_SIGNATURE]: MOCK_FAILED_TX }, { [DEFAULT_SIGNATURE]: MOCK_FAILED_STATUS })],
};

export const NoLogs: Story = {
    decorators: [withTransaction({ [DEFAULT_SIGNATURE]: MOCK_NO_LOGS_TX }, { [DEFAULT_SIGNATURE]: MOCK_STATUS })],
};
