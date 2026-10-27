import { makeBlock } from '@entities/block-data/__fixtures__/block-builders';
import { address, lamports, type Reward } from '@solana/kit';
import { withCluster, withTokenInfoBatch } from '@storybook-config/decorators';
import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BlockRewardsCard } from '../BlockRewardsCard';

const PUBKEYS = [
    '11111111111111111111111111111111',
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    'So11111111111111111111111111111111111111112',
    'SysvarRent111111111111111111111111111111111',
];

const sampleReward = (i: number): Reward => ({
    commission: 5,
    lamports: BigInt(1_500_000 + i * 1_000),
    postBalance: lamports(BigInt(12_345_678_900 + i * 1_000_000)),
    pubkey: address(PUBKEYS[i % PUBKEYS.length]),
    rewardType: i % 2 === 0 ? 'Staking' : 'Voting',
});

const meta: Meta<typeof BlockRewardsCard> = {
    component: BlockRewardsCard,
    decorators: [withCluster, withTokenInfoBatch, withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Components/Block/BlockRewardsCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const block = { ...makeBlock([]), rewards: Array.from({ length: 4 }, (_, index) => sampleReward(index)) };
const args = { block };

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
