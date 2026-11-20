import type { Meta, StoryObj } from '@storybook-config/types';

import { BaseCUProfilingCard } from '../BaseCUProfilingCard';

const meta: Meta<typeof BaseCUProfilingCard> = {
    component: BaseCUProfilingCard,
    tags: ['autodocs', 'test'],
    // TODO(dashkit): rename to match BaseCUProfilingCard once the Dashkit migration lands. Kept as-is
    // so the Storybook tree does not churn mid-migration.
    title: 'Components/Transaction/CUProfilingCard',
};

export default meta;
type Story = StoryObj<typeof BaseCUProfilingCard>;

export const TwoInstructions: Story = {
    args: {
        instructions: [
            {
                computeUnits: 45000,
                programId: '11111111111111111111111111111111',
            },
            {
                computeUnits: 45000,
                programId: '22222222222222222222222222222222',
            },
        ],
    },
};

// Resolved names replace the "Unknown Instruction" fallback the legend shows otherwise. Both carry the
// #N prefix either way; the tooltip qualifies the name with its program instead.
export const WithInstructionNames: Story = {
    args: {
        instructions: [
            {
                computeUnits: 105,
                name: 'Transfer Checked',
                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                programName: 'Token Program',
            },
            {
                computeUnits: 150,
                name: 'Set Compute Unit Price',
                programId: 'ComputeBudget111111111111111111111111111111',
                programName: 'Compute Budget Program',
            },
            {
                computeUnits: 150,
                name: 'Set Compute Unit Limit',
                programId: 'ComputeBudget111111111111111111111111111111',
                programName: 'Compute Budget Program',
            },
        ],
        unitsConsumed: 405,
    },
};

// Long names must truncate rather than overflow the card.
export const WithLongInstructionNames: Story = {
    args: {
        instructions: [
            {
                computeUnits: 120000,
                name: 'Shared Accounts Route With Token Ledger',
                programId: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
                programName: 'Jupiter Aggregator V6',
            },
            {
                computeUnits: 40000,
                name: 'Create Idempotent',
                programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
                programName: 'Associated Token Account Program',
            },
        ],
        unitsConsumed: 160000,
    },
};

// Maximum color variations (10 instructions)
export const TenInstructions: Story = {
    args: {
        instructions: [
            {
                computeUnits: 100000,
                programId: 'Program1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            },
            {
                computeUnits: 85000,
                programId: 'Program2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            },
            {
                computeUnits: 70000,
                programId: 'Program3xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            },
            {
                computeUnits: 55000,
                programId: 'Program4xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            },
            {
                computeUnits: 40000,
                programId: 'Program5xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            },
            {
                computeUnits: 30000,
                programId: 'Program6xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            },
            {
                computeUnits: 20000,
                programId: 'Program7xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            },
            {
                computeUnits: 15000,
                programId: 'Program8xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            },
            {
                computeUnits: 10000,
                programId: 'Program9xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            },
            {
                computeUnits: 5000,
                programId: 'Program10xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            },
        ],
    },
};

export const WithUnknownComputeUnits: Story = {
    args: {
        instructions: [
            {
                computeUnits: 50000,
                programId: '11111111111111111111111111111111',
            },
            {
                computeUnits: undefined,
                programId: '22222222222222222222222222222222',
            },
            {
                computeUnits: 30000,
                programId: '33333333333333333333333333333333',
            },
        ],
        unitsConsumed: 51200,
    },
};

// Empty case (should render nothing)
export const EmptyInstructions: Story = {
    args: {
        instructions: [],
    },
};
