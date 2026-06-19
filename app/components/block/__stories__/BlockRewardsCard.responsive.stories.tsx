import { nextjsParameters, withCluster, withTokenInfoBatch } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BlockRewardsCard } from '../BlockRewardsCard';

const PUBKEYS = [
    '11111111111111111111111111111111',
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    'So11111111111111111111111111111111111111112',
    'SysvarRent111111111111111111111111111111111',
];

const sampleReward = (i: number) => ({
    lamports: 1_500_000 + i * 1_000,
    postBalance: 12_345_678_900 + i * 1_000_000,
    pubkey: PUBKEYS[i % PUBKEYS.length],
    rewardType: i % 2 === 0 ? 'Staking' : 'Voting',
});

const meta: Meta<typeof BlockRewardsCard> = {
    component: BlockRewardsCard,
    decorators: [withCluster, withTokenInfoBatch, withViewportFromGlobal],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Block/BlockRewardsCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = { block: { rewards: Array.from({ length: 4 }, (_, i) => sampleReward(i)) } as any };

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
