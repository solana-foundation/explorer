import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters } from '@storybook-config/decorators';

import {
    DEFAULT_SIGNATURE,
    MOCK_FAILED_STATUS,
    MOCK_FAILED_TX,
    MOCK_PARSED_TX,
    MOCK_STATUS,
} from '../__fixtures__/transaction';
import { withTransactionProviders } from '../__fixtures__/withTransactionProviders';
import { InstructionsSection } from '../InstructionsSection';

const meta: Meta<typeof InstructionsSection> = {
    args: {
        signature: DEFAULT_SIGNATURE,
    },
    component: InstructionsSection,
    parameters: {
        ...nextjsParameters,
    },
    tags: ['autodocs', 'test'],
    title: 'Features/Transaction/InstructionsSection',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SystemTransfer: Story = {
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

export const NoDetails: Story = {
    decorators: [
        Story => {
            const Wrapper = withTransactionProviders({}, { [DEFAULT_SIGNATURE]: MOCK_STATUS });
            return (
                <Wrapper>
                    <Story />
                </Wrapper>
            );
        },
    ],
};
