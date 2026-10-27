import { makeBlock } from '@entities/block-data/__fixtures__/block-builders';
import { address, lamports, type Reward } from '@solana/kit';
import { withCluster, withTokenInfoBatch } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BlockRewardsCard } from '../BlockRewardsCard';
import { ACCOUNT_IDS } from './fixtures';

const meta: Meta<typeof BlockRewardsCard> = {
    component: BlockRewardsCard,
    decorators: [withCluster, withTokenInfoBatch],
    tags: ['autodocs', 'test'],
    title: 'Components/Block/BlockRewardsCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

// We rotate through a fixed set of known-good pubkeys to give every reward row a distinct, parseable address.
const sampleReward = (i: number): Reward => ({
    commission: 5,
    lamports: BigInt(1_500_000 + i * 1_000),
    postBalance: lamports(BigInt(12_345_678_900 + i * 1_000_000)),
    pubkey: address(ACCOUNT_IDS[i % ACCOUNT_IDS.length]),
    rewardType: i % 2 === 0 ? 'Staking' : 'Voting',
});

const blockWithRewards = (count: number) => ({
    ...makeBlock([]),
    rewards: Array.from({ length: count }, (_, index) => sampleReward(index)),
});

export const WithRewards: Story = {
    args: {
        block: blockWithRewards(8),
    },
};

// More than one page (PAGE_SIZE = 10) so the "Load More" footer shows.
export const WithManyRewards: Story = {
    args: {
        block: blockWithRewards(25),
    },
};
