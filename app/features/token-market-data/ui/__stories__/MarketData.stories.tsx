import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { MarketData } from '../MarketData';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    component: MarketData,
    tags: ['autodocs', 'test'],
    title: 'Features/TokenMarketData/MarketData',
} satisfies Meta<typeof MarketData>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const MarketCap = {
    args: {
        label: 'Market Cap',
        lastUpdatedAt: new Date('2026-01-01T00:00:00Z'),
        value: {
            volume: 58_800_000_000,
        },
    },
    async play({ canvasElement }) {
        const canvas = within(canvasElement);
        const marketCapEl = canvas.getByText('Market Cap');
        expect(marketCapEl).toBeInTheDocument();
        const marketCapValueEl = canvas.getByText('$58.8B');
        expect(marketCapValueEl).toBeInTheDocument();
    },
} satisfies Story;

export const Volume = {
    args: {
        label: '24 Hour Volume',
        value: { volume: 3_600_000_000 },
    },
    async play({ canvasElement }) {
        const canvas = within(canvasElement);
        const volumeEl = canvas.getByText('24 Hour Volume');
        expect(volumeEl).toBeInTheDocument();
        const volumeValueEl = canvas.getByText('$3.6B');
        expect(volumeValueEl).toBeInTheDocument();
    },
} satisfies Story;

export const PriceUpTrend = priceStory(1, 0.1);
export const PriceDownTrend = priceStory(2, -0.1);
export const PriceNeutralTrend = priceStory(2, 0, '0%');

function priceStory(rank: number, trend: number, ...texts: string[]) {
    return {
        args: { label: 'Price', rank, value: { precision: 6, price: 0.999887, trend } },
        async play({ canvasElement }) {
            const canvas = within(canvasElement);
            for (const text of ['Price', '$0.999887', `Rank #${rank}`, ...texts]) {
                expect(canvas.getByText(text)).toBeInTheDocument();
            }
        },
    } satisfies Story;
}
