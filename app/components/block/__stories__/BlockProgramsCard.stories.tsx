import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { nextjsParameters, withCluster } from '@storybook-config/decorators';

import { BlockProgramsCard } from '../BlockProgramsCard';

const meta: Meta<typeof BlockProgramsCard> = {
    component: BlockProgramsCard,
    decorators: [withCluster],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Block/BlockProgramsCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

// Empty block exercises the wrapper without a full VersionedBlockResponse fixture.
export const EmptyBlock: Story = {
    args: {
        block: { transactions: [] } as any,
    },
};
