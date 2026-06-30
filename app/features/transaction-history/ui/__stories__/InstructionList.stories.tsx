import type { Meta, StoryObj } from '@storybook-config/types';

import { InstructionList } from '../InstructionList';

const meta = {
    component: InstructionList,
    tags: ['autodocs', 'test'],
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

// Exactly the inline limit (3) — all rendered inline, no overflow line.
export const ExactlyThree: Story = {
    args: {
        instructions: [
            { name: 'Set Compute Unit Limit', program: 'Compute Budget' },
            { name: 'Set Compute Unit Price', program: 'Compute Budget' },
            { name: 'Transfer', program: 'System' },
        ],
    },
};

// Beyond the inline limit — the first 3 render inline, the rest collapse into a "+N more" tooltip.
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
