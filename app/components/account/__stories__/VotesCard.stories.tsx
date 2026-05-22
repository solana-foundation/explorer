import type { Meta, StoryObj } from '@storybook/react';

import { withCluster } from '@storybook-config/decorators';

import { VotesCard } from '../VotesCard';

const meta: Meta<typeof VotesCard> = {
    component: VotesCard,
    decorators: [withCluster],
    title: 'Components/Account/VotesCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

const votes = Array.from({ length: 6 }, (_, i) => ({
    slot: 312_456_780 + i,
    confirmationCount: 31 - i,
}));

export const WithVotes: Story = {
    args: {
        voteAccount: {
            info: { votes },
        } as any,
    },
};

export const Empty: Story = {
    args: {
        voteAccount: { info: { votes: [] } } as any,
    },
};
