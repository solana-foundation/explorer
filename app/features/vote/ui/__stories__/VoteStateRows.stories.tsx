import { nextjsParameters, withCardTableField } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { VoteStateRows } from '../instructions/VoteStateRows';
import { BASE_SLOT, HASH, TIMESTAMP } from './fixtures';

const meta = {
    component: VoteStateRows,
    decorators: [withCardTableField],
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Features/Vote/VoteStateRows',
} satisfies Meta<typeof VoteStateRows>;

export default meta;
type Story = StoryObj<typeof meta>;

const LOCKOUTS = [
    { confirmation_count: 31, slot: BASE_SLOT },
    { confirmation_count: 30, slot: BASE_SLOT + 1 },
    { confirmation_count: 29, slot: BASE_SLOT + 2 },
];

// Tower-sync payload: vote hash, block id, root slot, timestamp, and the lockout list.
export const TowerSync: Story = {
    args: {
        voteState: { blockId: HASH, hash: HASH, lockouts: LOCKOUTS, root: BASE_SLOT - 1, timestamp: TIMESTAMP },
    },
};

// Legacy update-vote-state payload: no blockId, null root/timestamp (those rows are omitted).
export const UpdateVoteState: Story = {
    args: {
        voteState: { hash: HASH, lockouts: LOCKOUTS, root: null, timestamp: null },
    },
};
