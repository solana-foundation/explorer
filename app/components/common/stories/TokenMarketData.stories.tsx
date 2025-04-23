import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';

import * as mockCoingecko from '@/app/__tests__/mock-coingecko';
import { CoingeckoStatus } from '@/app/utils/coingecko';

import { TokenMarketData, TokenMarketData2 } from '../TokenMarketData';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    component: TokenMarketData2,
    tags: ['autodocs'],
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
        tokenPriceInfo: {},
    },
    // async play({ canvasElement }) {
    //     // const canvas = within(canvasElement);
    //     // const tooltipButton = canvas.getByRole('button');
    //     // expect(tooltipButton).toHaveAttribute('data-slot', 'tooltip-trigger');
    //     // await userEvent.hover(tooltipButton);
    // },
};

export const Loading: Story = {
    args: {
        coinInfo: {
            coinInfo: undefined,
            status: CoingeckoStatus.Loading,
        },
    },
};

export const FetchingFailed: Story = {
    args: {
        coinInfo: {
            coinInfo: undefined,
            status: CoingeckoStatus.FetchFailed,
        },
    },
};
