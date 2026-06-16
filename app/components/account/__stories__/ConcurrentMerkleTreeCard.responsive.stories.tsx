import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withCluster, withTokenInfoBatch } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { ConcurrentMerkleTreeCard } from '../ConcurrentMerkleTreeCard';
import { buildConcurrentMerkleTreeData } from './mocks/concurrent-merkle-tree';

const meta: Meta<typeof ConcurrentMerkleTreeCard> = {
    component: ConcurrentMerkleTreeCard,
    decorators: [withCluster, withTokenInfoBatch, withViewportFromGlobal],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/ConcurrentMerkleTreeCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = { data: buildConcurrentMerkleTreeData() };

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
