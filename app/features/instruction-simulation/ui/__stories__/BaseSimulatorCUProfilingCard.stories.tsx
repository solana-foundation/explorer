import { PublicKey } from '@solana/web3.js';
import { nextjsParameters } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BaseSimulatorCUProfilingCard } from '../BaseSimulatorCUProfilingCard';

const SYSTEM_PROGRAM = PublicKey.default;
const TOKEN_PROGRAM = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

const meta: Meta<typeof BaseSimulatorCUProfilingCard> = {
    component: BaseSimulatorCUProfilingCard,
    parameters: { ...nextjsParameters },
    tags: ['autodocs', 'test'],
    // TODO(dashkit): rename to match BaseSimulatorCUProfilingCard once the Dashkit migration lands. Kept
    // as-is so the Storybook tree does not churn mid-migration.
    title: 'Features/InstructionSimulation/SimulatorCUProfilingCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

// Rows arrive resolved from useSimulationInstructionNames, so the card never fetches.
export const TwoInstructions: Story = {
    args: {
        instructions: [
            { data: undefined, name: 'Transfer', programId: SYSTEM_PROGRAM, programName: 'System Program' },
            { data: undefined, name: 'Transfer Checked', programId: TOKEN_PROGRAM, programName: 'Token Program' },
        ],
        invocations: [
            { computeUnits: 45000, entries: [], programAddress: SYSTEM_PROGRAM.toBase58() },
            { computeUnits: 30000, entries: [], programAddress: TOKEN_PROGRAM.toBase58() },
        ],
        unitsConsumed: 75000,
    },
};

// No instruction name resolved, so the chart falls back to each instruction's position. The programs
// are still named, which is what the tooltip qualifies the position with.
export const WithoutResolvedNames: Story = {
    args: {
        instructions: [
            { data: undefined, name: undefined, programId: SYSTEM_PROGRAM, programName: 'System Program' },
            { data: undefined, name: undefined, programId: TOKEN_PROGRAM, programName: 'Token Program' },
        ],
        invocations: TwoInstructions.args?.invocations ?? [],
        unitsConsumed: 75000,
    },
};

// With no logs, the builtin shows its fixed cost and the Token Program instruction shows `Unknown`.
export const NoLogs: Story = {
    args: {
        instructions: [
            { data: undefined, name: 'Transfer', programId: SYSTEM_PROGRAM, programName: 'System Program' },
            { data: undefined, name: 'Transfer Checked', programId: TOKEN_PROGRAM, programName: 'Token Program' },
        ],
        invocations: [],
    },
};
