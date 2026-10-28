import { withCluster } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { VotesCard } from '../VotesCard';
import { BASE_SLOT, voteAccountFixture } from './fixtures';

const meta = {
    component: VotesCard,
    decorators: [withCluster],
    tags: ['autodocs', 'test'],
    title: 'Features/Vote/VotesCard',
} satisfies Meta<typeof VotesCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const votes = Array.from({ length: 6 }, (_, i) => ({
    confirmationCount: 31 - i,
    slot: BASE_SLOT + i,
}));

export const WithVotes: Story = {
    args: {
        voteAccount: voteAccountFixture(votes),
    },
};

export const Empty: Story = {
    args: {
        voteAccount: voteAccountFixture([]),
    },
};
