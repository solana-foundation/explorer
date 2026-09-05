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
        instructions: [{ name: 'Transfer', programName: 'System' }],
    },
};

export const FewInstructions: Story = {
    args: {
        instructions: [
            { name: 'Transfer', programName: 'System' },
            { name: 'Transfer Checked', programName: 'Token' },
        ],
    },
};

// Exactly the inline limit (3) — all rendered inline, no overflow line.
export const ExactlyThree: Story = {
    args: {
        instructions: [
            { name: 'Set Compute Unit Limit', programName: 'Compute Budget' },
            { name: 'Set Compute Unit Price', programName: 'Compute Budget' },
            { name: 'Transfer', programName: 'System' },
        ],
    },
};

// Beyond the inline limit — the first 3 render inline, the rest collapse into a "+N more" tooltip.
export const ManyInstructions: Story = {
    args: {
        instructions: [
            { name: 'Set Compute Unit Limit', programName: 'Compute Budget' },
            { name: 'Set Compute Unit Price', programName: 'Compute Budget' },
            { name: 'Transfer', programName: 'System' },
            { name: 'Transfer Checked', programName: 'Token' },
            { name: 'Create', programName: 'Associated Token Account' },
        ],
    },
};

export const WithUnknown: Story = {
    args: {
        instructions: [
            { name: 'Advance Nonce', programName: 'System Program' },
            { name: 'Set Compute Unit Price', programName: 'Compute Budget Program' },
            { name: 'Unknown Instruction', programName: 'Some Program' },
            { name: 'Unknown Instruction', programName: 'Other Program' },
        ],
    },
};
