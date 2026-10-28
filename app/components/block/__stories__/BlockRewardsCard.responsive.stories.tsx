import { withCluster, withTokenInfoBatch } from '@storybook-config/decorators';
import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BlockRewardsCard } from '../BlockRewardsCard';
import * as Base from './BlockRewardsCard.stories';

const meta: Meta<typeof BlockRewardsCard> = {
    component: BlockRewardsCard,
    decorators: [withCluster, withTokenInfoBatch, withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Components/Block/BlockRewardsCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = Base.WithRewards.args;

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
