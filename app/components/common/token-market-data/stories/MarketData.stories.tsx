import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';

import { MarketData } from '../MarketData';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    component: MarketData,
    tags: ['autodocs'],
    title: 'Components/Common/TokenMarketData/MarketData',
} satisfies Meta<typeof MarketData>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const MarketCap: Story = {
    args: {
        label: 'Market Cap',
        value: '$58.8B',
    },
    // async play({ canvasElement }) {
    //     // const canvas = within(canvasElement);
    //     // const tooltipButton = canvas.getByRole('button');
    //     // expect(tooltipButton).toHaveAttribute('data-slot', 'tooltip-trigger');
    //     // await userEvent.hover(tooltipButton);
    // },
};

export const Price: Story = {
    args: {
        dynamic: '0.00%',
        dynamicTrend: 'up',
        label: 'Price',
        rank: 1,
        value: '$0.999887',
    },
    // async play({ canvasElement }) {
    //     // const canvas = within(canvasElement);
    //     // const tooltipButton = canvas.getByRole('button');
    //     // expect(tooltipButton).toHaveAttribute('data-slot', 'tooltip-trigger');
    //     // await userEvent.hover(tooltipButton);
    // },
};
