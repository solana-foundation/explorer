import { makeBlock } from '@entities/block-data/__fixtures__/block-builders';
import { withCluster } from '@storybook-config/decorators';
import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BlockProgramsCard } from '../BlockProgramsCard';

const meta: Meta<typeof BlockProgramsCard> = {
    component: BlockProgramsCard,
    decorators: [withCluster, withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Components/Block/BlockProgramsCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = { block: makeBlock([]) };

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
