import { Meta, StoryObj } from '@storybook/react';
import { expect } from '@storybook/test';

import * as mockCoingecko from '@/app/__tests__/mock-coingecko';
import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';

import { Header } from '../Header';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    component: Header,
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
    title: 'Components/Header',
} satisfies Meta<typeof Header>;

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
        const children = canvasElement.children;
        expect(children.length).toBeGreaterThanOrEqual(1);
    },
};
