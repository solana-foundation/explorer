import type { Meta, StoryObj } from '@storybook/react';

import { gen } from '@__fixtures__/gen';

import { BlockhashesCard } from '../BlockhashesCard';

const meta: Meta<typeof BlockhashesCard> = {
    component: BlockhashesCard,
    tags: ['autodocs'],
    title: 'Components/Account/BlockhashesCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithEntries: Story = {
    args: {
        blockhashes: Array.from({ length: 4 }, (_, i) => ({
            blockhash: gen.blockhash(i),
            feeCalculator: { lamportsPerSignature: '5000' },
        })),
    },
};

export const Empty: Story = {
    args: { blockhashes: [] },
};
