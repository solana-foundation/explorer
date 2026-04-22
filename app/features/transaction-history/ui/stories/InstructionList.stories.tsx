import type { Meta, StoryObj } from '@storybook/react';

import { InstructionList } from '../InstructionList';

const meta = {
    component: InstructionList,
    title: 'Features/TransactionHistory/InstructionList',
} satisfies Meta<typeof InstructionList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleInstruction: Story = {
    args: {
        instructions: [{ name: 'Transfer', program: 'System' }],
    },
};

export const FewInstructions: Story = {
    args: {
        instructions: [
            { name: 'Transfer', program: 'System' },
            { name: 'Transfer Checked', program: 'Token' },
        ],
    },
};

export const ExactlyThree: Story = {
    args: {
        instructions: [
            { name: 'Set Compute Unit Limit', program: 'Compute Budget' },
            { name: 'Set Compute Unit Price', program: 'Compute Budget' },
            { name: 'Transfer', program: 'System' },
        ],
    },
};

export const ManyInstructions: Story = {
    args: {
        instructions: [
            { name: 'Set Compute Unit Limit', program: 'Compute Budget' },
            { name: 'Set Compute Unit Price', program: 'Compute Budget' },
            { name: 'Transfer', program: 'System' },
            { name: 'Transfer Checked', program: 'Token' },
            { name: 'Create', program: 'Associated Token Account' },
        ],
    },
};

export const WithUnknown: Story = {
    args: {
        instructions: [
            { name: 'Advance Nonce', program: 'System Program' },
            { name: 'Set Compute Unit Price', program: 'Compute Budget Program' },
            { name: 'Unknown Instruction', program: 'Some Program' },
            { name: 'Unknown Instruction', program: 'Other Program' },
        ],
    },
};
