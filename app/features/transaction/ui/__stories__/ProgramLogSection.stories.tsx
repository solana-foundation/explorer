import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters } from '@storybook-config/decorators';

import { ProgramLogSection } from '../ProgramLogSection';
import {
    DEFAULT_SIGNATURE,
    MOCK_FAILED_STATUS,
    MOCK_FAILED_TX,
    MOCK_NO_LOGS_TX,
    MOCK_PARSED_TX,
    MOCK_STATUS,
} from './__fixtures__/transaction';
import { withTransactionProviders } from './__fixtures__/withTransactionProviders';

const meta: Meta<typeof ProgramLogSection> = {
    args: {
        signature: DEFAULT_SIGNATURE,
    },
    component: ProgramLogSection,
    parameters: {
        ...nextjsParameters,
    },
    title: 'Components/Transaction/ProgramLogSection',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SuccessfulLogs: Story = {
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

export const FailedLogs: Story = {
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

export const NoLogs: Story = {
    decorators: [
        Story => {
            const Wrapper = withTransactionProviders(
                { [DEFAULT_SIGNATURE]: MOCK_NO_LOGS_TX },
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
