import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { mockVersionedMessage } from '@storybook-config/__fixtures__/messages';
import { nextjsParameters } from '@storybook-config/decorators';
import { Cluster } from '@utils/cluster';

import { SimulatorCUProfilingCard } from '../SimulatorCUProfilingCard';

const SYSTEM_PROGRAM = PublicKey.default;
const TOKEN_PROGRAM = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

const message = mockVersionedMessage({
    compiledInstructions: [
        { accountKeyIndexes: [], data: new Uint8Array(), programIdIndex: 0 },
        { accountKeyIndexes: [], data: new Uint8Array(), programIdIndex: 1 },
    ],
    staticAccountKeys: [SYSTEM_PROGRAM, TOKEN_PROGRAM],
});

const meta: Meta<typeof SimulatorCUProfilingCard> = {
    component: SimulatorCUProfilingCard,
    parameters: { ...nextjsParameters, layout: 'padded' },
    tags: ['autodocs', 'test'],
    title: 'Features/InstructionSimulation/SimulatorCUProfilingCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoInstructions: Story = {
    args: {
        cluster: Cluster.MainnetBeta,
        epoch: 800n,
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
        message,
        unitsConsumed: 75000,
    },
};

export const NoLogs: Story = {
    args: {
        cluster: Cluster.MainnetBeta,
        epoch: 800n,
        logs: [],
        message,
    },
};
