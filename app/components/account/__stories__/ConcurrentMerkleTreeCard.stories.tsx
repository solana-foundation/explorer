import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withCluster, withTokenInfoBatch } from '@storybook-config/decorators';

import { ConcurrentMerkleTreeCard } from '../ConcurrentMerkleTreeCard';
import { buildConcurrentMerkleTreeData } from './mocks/concurrent-merkle-tree';

const meta = {
    component: ConcurrentMerkleTreeCard,
    decorators: [withCluster, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Account/ConcurrentMerkleTreeCard',
} satisfies Meta<typeof ConcurrentMerkleTreeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { data: buildConcurrentMerkleTreeData() },
};

export const DeepTree: Story = {
    args: {
        data: buildConcurrentMerkleTreeData({
            maxBufferSize: 16,
            maxDepth: 14,
            rightMostIndex: 11_287,
            sequenceNumber: 124_998,
        }),
    },
};
