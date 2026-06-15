import { address } from '@solana/kit';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withCardTableField, withTokenInfoBatch } from '@storybook-config/decorators';

import { DetailRow } from '../instructions/DetailRow';
import { VOTE_ACCOUNT_ADDRESS } from './fixtures';

const meta = {
    component: DetailRow,
    decorators: [withCardTableField, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Features/Vote/DetailRow',
} satisfies Meta<typeof DetailRow>;

export default meta;
type Story = StoryObj<typeof meta>;

// pubkey variant renders a right-aligned, linked KitAddress.
export const Pubkey: Story = {
    args: { label: 'Vote Account', pubkey: address(VOTE_ACCOUNT_ADDRESS) },
};

// children variant renders arbitrary right-aligned content.
export const Text: Story = {
    args: { children: 'Voter (BLS)', label: 'Authority Type' },
};

// monospace children variant for numeric / hash-like values.
export const Monospace: Story = {
    args: { children: '414213969', label: 'Root Slot', monospace: true },
};
