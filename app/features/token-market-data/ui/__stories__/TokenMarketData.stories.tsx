import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { createTokenMarketStats } from '../../__tests__/__fixtures__/market-data';
import { TokenMarketDataStatus } from '../../model/types';
import { TokenMarketData } from '../TokenMarketData';

const meta = {
    component: TokenMarketData,
    tags: ['autodocs', 'test'],
    title: 'Features/TokenMarketData/TokenMarketData',
} satisfies Meta<typeof TokenMarketData>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
    args: { marketData: { stats: createTokenMarketStats(), status: TokenMarketDataStatus.Success } },
    async play({ canvasElement }) {
        expect.assertions(1);
        expect(within(canvasElement).queryAllByLabelText('market-data')).toHaveLength(3);
    },
};

export const Loading: Story = {
    args: { marketData: { stats: undefined, status: TokenMarketDataStatus.Loading } },
    async play({ canvasElement }) {
        expect.assertions(1);
        expect(within(canvasElement).getByText('Loading token price data')).toBeInTheDocument();
    },
};

export const SubDollarPrice: Story = {
    args: { marketData: { stats: createTokenMarketStats({ price: 0.5 }), status: TokenMarketDataStatus.Success } },
    async play({ canvasElement }) {
        expect.assertions(1);
        expect(within(canvasElement).getByText('$0.500000')).toBeInTheDocument();
    },
};

export const NoData: Story = {
    args: { marketData: { status: TokenMarketDataStatus.FetchFailed } },
    async play({ canvasElement }) {
        expect.assertions(1);
        expect(within(canvasElement).queryAllByLabelText('market-data')).toHaveLength(0);
    },
};
