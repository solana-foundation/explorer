import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { MarketData } from '../MarketData';
import * as Base from './MarketData.stories';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    component: MarketData.Series,
    tags: ['autodocs', 'test'],
    title: 'Features/TokenMarketData/MarketDataSeries',
} satisfies Meta<typeof MarketData.Series>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
    args: {
        data: [Base.MarketCap.args, Base.Volume.args, Base.PriceUpTrend.args],
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
