import type { Meta, StoryObj } from '@storybook/react';

import { withCluster } from '@storybook-config/decorators';

import { BlockProgramsCard } from '../BlockProgramsCard';

const meta: Meta<typeof BlockProgramsCard> = {
    component: BlockProgramsCard,
    decorators: [withCluster],
    title: 'Components/Block/BlockProgramsCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

// Empty block — renders the outer card structure with zero counts; useful for visual-regression
// of the card wrappers without fixture overhead of constructing realistic transactions.
export const EmptyBlock: Story = {
    args: {
        block: { transactions: [] } as any,
    },
};
