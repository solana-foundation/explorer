import { PublicKey } from '@solana/web3.js';
import { nextjsParameters } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { Cluster } from '@utils/cluster';

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
        cluster: Cluster.MainnetBeta,
        epoch: 800n,
        instructions: [
            { name: 'Transfer', programId: SYSTEM_PROGRAM, programName: 'System Program' },
            { name: 'Transfer Checked', programId: TOKEN_PROGRAM, programName: 'Token Program' },
        ],
        logs: [
            {
                computeUnits: 45000,
                failed: false,
                invokedProgram: SYSTEM_PROGRAM.toBase58(),
                logs: [],
                truncated: false,
            },
            {
                computeUnits: 30000,
                failed: false,
                invokedProgram: TOKEN_PROGRAM.toBase58(),
                logs: [],
                truncated: false,
            },
        ],
        unitsConsumed: 75000,
    },
};

// No instruction name resolved, so the chart falls back to each instruction's position. The programs
// are still named, which is what the tooltip qualifies the position with.
export const WithoutResolvedNames: Story = {
    args: {
        cluster: Cluster.MainnetBeta,
        epoch: 800n,
        instructions: [
            { name: undefined, programId: SYSTEM_PROGRAM, programName: 'System Program' },
            { name: undefined, programId: TOKEN_PROGRAM, programName: 'Token Program' },
        ],
        logs: TwoInstructions.args?.logs ?? [],
        unitsConsumed: 75000,
    },
};

// The logs said nothing about either instruction, so both fall back to their scheduled CU reserve.
export const NoLogs: Story = {
    args: {
        cluster: Cluster.MainnetBeta,
        epoch: 800n,
        instructions: [
            { name: 'Transfer', programId: SYSTEM_PROGRAM, programName: 'System Program' },
            { name: 'Transfer Checked', programId: TOKEN_PROGRAM, programName: 'Token Program' },
        ],
        logs: [],
    },
};
