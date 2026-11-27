import { makeBlock } from '@entities/block-data/__fixtures__/block-builders';
import { withCluster } from '@storybook-config/decorators';
import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BlockHistoryCard } from '../BlockHistoryCard';

const meta: Meta<typeof BlockHistoryCard> = {
    component: BlockHistoryCard,
    decorators: [withCluster, withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Components/Block/BlockHistoryCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = { block: makeBlock([]), epoch: 500n };

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
