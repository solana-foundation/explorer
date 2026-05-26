import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withCluster, withTokenInfoBatch } from '@storybook-config/decorators';

import { BlockRewardsCard } from '../BlockRewardsCard';

const meta: Meta<typeof BlockRewardsCard> = {
    component: BlockRewardsCard,
    decorators: [withCluster, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Components/Block/BlockRewardsCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

// Each base58 pubkey must use the valid alphabet (no 0, O, I, l). We rotate through a fixed
// set of known-good pubkeys to give every reward row a distinct, parseable address.
const PUBKEYS = [
    '11111111111111111111111111111111',
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
    'So11111111111111111111111111111111111111112',
    'SysvarRent111111111111111111111111111111111',
    'SysvarC1ock11111111111111111111111111111111',
    'Stake11111111111111111111111111111111111111',
    'Vote111111111111111111111111111111111111111',
    'BPFLoaderUpgradeab1e11111111111111111111111',
    'ComputeBudget111111111111111111111111111111',
    'AddressLookupTab1e1111111111111111111111111',
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
];

const sampleReward = (i: number) => ({
    lamports: 1_500_000 + i * 1_000,
    postBalance: 12_345_678_900 + i * 1_000_000,
    pubkey: PUBKEYS[i % PUBKEYS.length],
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
