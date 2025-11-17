import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { MarketData } from '../MarketData';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    component: MarketData.Series,
    tags: ['autodocs', 'test'],
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
                lastUpdatedAt: new Date(),
                value: {
                    volume: 58_800_000_000,
                },
            },
            {
                label: '24 Hour Volume',
                value: { volume: 3_600_000_000 },
            },
            {
                label: 'Price',
                rank: 1,
                value: {
                    precision: 6,
                    price: 0.999887,
                    trend: 0.1,
                },
            },
        ],
    },
    async play({ canvasElement }) {
        const canvas = within(canvasElement);
        const priceEl = canvas.getByText('Price');
        expect(priceEl).toBeInTheDocument();
        const priceValueEl = canvas.getByText('$0.999887');
        expect(priceValueEl).toBeInTheDocument();
        const volumeEl = canvas.getByText('24 Hour Volume');
        expect(volumeEl).toBeInTheDocument();
        const volumeValueEl = canvas.getByText('$3.6B');
        expect(volumeValueEl).toBeInTheDocument();
        const marketCapEl = canvas.getByText('Market Cap');
        expect(marketCapEl).toBeInTheDocument();
        const marketCapValueEl = canvas.getByText('$58.8B');
        expect(marketCapValueEl).toBeInTheDocument();
    },
};
