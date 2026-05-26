import type { Meta, StoryObj } from '@storybook/react';

import { BlockhashesCard } from '../BlockhashesCard';

const meta: Meta<typeof BlockhashesCard> = {
    component: BlockhashesCard,
    tags: ['autodocs'],
    title: 'Components/Account/BlockhashesCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleBlockhash = (i: number) => ({
    blockhash: `5o7n8u${'A'.repeat(20)}${i}xY${'k'.repeat(20)}`,
    feeCalculator: { lamportsPerSignature: 5000 },
});

export const WithEntries: Story = {
    args: {
        blockhashes: Array.from({ length: 4 }, (_, i) => sampleBlockhash(i)),
    },
};

export const Empty: Story = {
    args: { blockhashes: [] },
};
