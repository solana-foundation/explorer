import { makeBlock } from '@entities/block-data/__fixtures__/block-builders';
import { withCluster } from '@storybook-config/decorators';
import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BlockAccountsCard } from '../BlockAccountsCard';

const meta: Meta<typeof BlockAccountsCard> = {
    component: BlockAccountsCard,
    decorators: [withCluster, withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Components/Block/BlockAccountsCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = { block: makeBlock([]), blockSlot: 312_456_789 };

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
