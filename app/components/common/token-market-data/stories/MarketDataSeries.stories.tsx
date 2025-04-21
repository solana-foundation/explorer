import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';

import { MarketData } from '../MarketData';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    component: MarketData.Series,
    tags: ['autodocs'],
    title: 'Components/Common/TokenMarketData/MarketDataSeries',
} satisfies Meta<typeof MarketData.Series>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
    args: {
        data: [
            {
                label: 'Market Cap',
                value: '$58.8B',
            },
            {
                label: '24H volume',
                value: '$58',
            },
            {
                dynamic: '0.00%',
                dynamicTrend: 'up',
                label: 'Price',
                rank: 1,
                value: '$0.999887',
            },
        ],
    },
};
