import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import * as mockCoingecko from '@/app/__tests__/mock-coingecko';
import { CoingeckoStatus } from '@/app/utils/coingecko';

import { TokenMarketData } from '../TokenMarketData';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    component: TokenMarketData,
    tags: ['autodocs', 'test'],
    title: 'Components/Common/TokenMarketData',
} satisfies Meta<typeof TokenMarketData>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
    args: {
        coinInfo: {
            coinInfo: mockCoingecko.coinInfo(),
            status: CoingeckoStatus.Success,
        },
        tokenInfo: mockCoingecko.tokenInfo(),
    },
    async play({ canvasElement }) {
        expect.assertions(1);
        const canvas = within(canvasElement);
        const tileEl = canvas.queryAllByLabelText('market-data');
        expect(tileEl).toHaveLength(3);
    },
};

export const Loading: Story = {
    args: {
        coinInfo: {
            coinInfo: undefined,
            status: CoingeckoStatus.Loading,
        },
        tokenInfo: mockCoingecko.tokenInfo(),
    },
    async play({ canvasElement }) {
        expect.assertions(1);
        const canvas = within(canvasElement);
        const loadingEl = canvas.getByText('Loading token price data');
        expect(loadingEl).toBeInTheDocument();
    },
};
