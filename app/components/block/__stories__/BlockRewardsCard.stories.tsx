import type { Meta, StoryObj } from '@storybook/react';

import { withCluster } from '@storybook-config/decorators';

import { BlockRewardsCard } from '../BlockRewardsCard';

const meta: Meta<typeof BlockRewardsCard> = {
    component: BlockRewardsCard,
    decorators: [withCluster],
    title: 'Components/Block/BlockRewardsCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleReward = (i: number) => ({
    pubkey: `So11111111111111111111111111111111111111${String(i).padStart(3, '0')}`,
    lamports: 1_500_000 + i * 1_000,
    postBalance: 12_345_678_900 + i * 1_000_000,
    rewardType: i % 2 === 0 ? 'Staking' : 'Voting',
});

export const WithRewards: Story = {
    args: {
        block: { rewards: Array.from({ length: 8 }, (_, i) => sampleReward(i)) } as any,
    },
};

export const WithManyRewards: Story = {
    args: {
        block: { rewards: Array.from({ length: 25 }, (_, i) => sampleReward(i)) } as any,
    },
};
