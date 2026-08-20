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
                defaultUnits: 150,
                programId: '11111111111111111111111111111111',
                scheduledUnits: 200000,
            },
            {
                computeUnits: 45000,
                defaultUnits: 0,
                programId: '22222222222222222222222222222222',
                scheduledUnits: 200000,
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
                defaultUnits: 0,
                name: 'Transfer Checked',
                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                programName: 'Token Program',
                scheduledUnits: 200000,
            },
            {
                computeUnits: 150,
                defaultUnits: 0,
                name: 'Set Compute Unit Price',
                programId: 'ComputeBudget111111111111111111111111111111',
                programName: 'Compute Budget Program',
                scheduledUnits: 200000,
            },
            {
                computeUnits: 150,
                defaultUnits: 0,
                name: 'Set Compute Unit Limit',
                programId: 'ComputeBudget111111111111111111111111111111',
                programName: 'Compute Budget Program',
                scheduledUnits: 200000,
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
                defaultUnits: 0,
                name: 'Shared Accounts Route With Token Ledger',
                programId: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
                programName: 'Jupiter Aggregator V6',
                scheduledUnits: 200000,
            },
            {
                computeUnits: 40000,
                defaultUnits: 0,
                name: 'Create Idempotent',
                programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
                programName: 'Associated Token Account Program',
                scheduledUnits: 200000,
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
                defaultUnits: 0,
                programId: 'Program1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                scheduledUnits: 200000,
            },
            {
                computeUnits: 85000,
                defaultUnits: 0,
                programId: 'Program2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                scheduledUnits: 200000,
            },
            {
                computeUnits: 70000,
                defaultUnits: 0,
                programId: 'Program3xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                scheduledUnits: 200000,
            },
            {
                computeUnits: 55000,
                defaultUnits: 0,
                programId: 'Program4xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                scheduledUnits: 200000,
            },
            {
                computeUnits: 40000,
                defaultUnits: 0,
                programId: 'Program5xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                scheduledUnits: 200000,
            },
            {
                computeUnits: 30000,
                defaultUnits: 0,
                programId: 'Program6xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                scheduledUnits: 200000,
            },
            {
                computeUnits: 20000,
                defaultUnits: 0,
                programId: 'Program7xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                scheduledUnits: 200000,
            },
            {
                computeUnits: 15000,
                defaultUnits: 0,
                programId: 'Program8xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                scheduledUnits: 200000,
            },
            {
                computeUnits: 10000,
                defaultUnits: 0,
                programId: 'Program9xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                scheduledUnits: 200000,
            },
            {
                computeUnits: 5000,
                defaultUnits: 0,
                programId: 'Program10xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                scheduledUnits: 200000,
            },
        ],
    },
};

export const WithZeroComputeUnits: Story = {
    args: {
        instructions: [
            {
                computeUnits: 50000,
                defaultUnits: 150,
                programId: '11111111111111111111111111111111',
                scheduledUnits: 200000,
            },
            {
                computeUnits: 0,
                defaultUnits: 1200,
                programId: 'AddressLookupTab1e1111111111111111111111111',
                scheduledUnits: 1200,
            },
            {
                computeUnits: 30000,
                defaultUnits: 0,
                programId: '33333333333333333333333333333333',
                scheduledUnits: 200000,
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
