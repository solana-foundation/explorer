import { gen } from '@__fixtures__/gen';
import { nextjsParameters, withCluster } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { VotesCard } from '../VotesCard';

const meta: Meta<typeof VotesCard> = {
    component: VotesCard,
    decorators: [withCluster],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Account/VotesCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

const baseSlot = Number(gen.slot(0));
const votes = Array.from({ length: 6 }, (_, i) => ({
    confirmationCount: 31 - i,
    slot: baseSlot + i,
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
