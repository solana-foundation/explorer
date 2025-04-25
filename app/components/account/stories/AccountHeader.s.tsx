import { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';

import * as mockCoingecko from '@/app/__tests__/mock-coingecko';
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
    parameters: {
        nextjs: {
            appDirectory: true,
        },
    },
    tags: ['autodocs'],
    title: 'Components/Account/AccountHeader',
} satisfies Meta<typeof AccountHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const HeaderUSDC: Story = {
    args: {
        account: mockCoingecko.account(),
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        isTokenInfoLoading: false,
        tokenInfo: mockCoingecko.tokenInfo(),
    },
    async play({ canvasElement }) {
        const canvas = within(canvasElement);
        const tokenEl = await canvas.findByText('USD Coin');
        expect(tokenEl).toBeInTheDocument();
    },
};
