import type { Meta, StoryObj } from '@storybook/react';

import { nextjsParameters, withCluster } from '@storybook-config/decorators';

import { BlockAccountsCard } from '../BlockAccountsCard';

const meta: Meta<typeof BlockAccountsCard> = {
    component: BlockAccountsCard,
    decorators: [withCluster],
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Components/Block/BlockAccountsCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

// Empty block — wrapper-only story for visual-regression coverage of the outer card.
export const EmptyBlock: Story = {
    args: {
        block: { transactions: [] } as any,
        blockSlot: 312_456_789,
    },
};
