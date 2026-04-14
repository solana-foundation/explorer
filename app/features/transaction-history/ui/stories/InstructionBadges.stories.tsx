import type { Meta, StoryObj } from '@storybook/react';

import { InstructionBadges } from '../InstructionBadges';

const meta = {
    component: InstructionBadges,
    title: 'Features/TransactionHistory/InstructionBadges',
} satisfies Meta<typeof InstructionBadges>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleInstruction: Story = {
    args: {
        names: ['System: Transfer'],
    },
};

export const FewInstructions: Story = {
    args: {
        names: ['System: Transfer', 'Token: Transfer Checked'],
    },
};

export const ExactlyThree: Story = {
    args: {
        names: ['Compute Budget: Set Compute Unit Limit', 'Compute Budget: Set Compute Unit Price', 'System: Transfer'],
    },
};

export const ManyInstructions: Story = {
    args: {
        names: [
            'Compute Budget: Set Compute Unit Limit',
            'Compute Budget: Set Compute Unit Price',
            'System: Transfer',
            'Token: Transfer Checked',
            'Associated Token Account: Create',
        ],
    },
};
