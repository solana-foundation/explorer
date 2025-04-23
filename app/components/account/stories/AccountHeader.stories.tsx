import { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';

import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';

import { AccountHeader } from '../AccountHeader';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    component: AccountHeader,
    decorators: [
        Story => (
            <ClusterProvider>
                <AccountsProvider>
                    <Story />
                </AccountsProvider>
            </ClusterProvider>
        ),
    ],
    tags: ['autodocs'],
    title: 'Components/Account/AccountHeader',
} satisfies Meta<typeof AccountHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
    args: {},
    async play({ canvasElement }) {
        const canvas = within(canvasElement);
    },
};
