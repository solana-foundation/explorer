import { nextjsParameters, withCluster } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { VotesCard } from '../VotesCard';
import { BASE_SLOT, voteAccountFixture } from './fixtures';

const meta: Meta<typeof VotesCard> = {
    component: VotesCard,
    decorators: [withCluster],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    // TODO: rename to 'Features/Vote/VotesCard' once we move off Dashkit — keeping the legacy
    // title for now avoids churn in the Storybook tree mid-migration.
    title: 'Components/Account/VotesCard',
};

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
