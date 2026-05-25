import { PublicKey, VersionedMessage } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withCluster } from '@storybook-config/decorators';

import { SimulatorCard } from '../SimulationCard';

const FEE_PAYER = new PublicKey('11111111111111111111111111111111');

const idleMessage = {
    addressTableLookups: [],
    compiledInstructions: [],
    header: {
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 0,
        numRequiredSignatures: 1,
    },
    recentBlockhash: '4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZAMdL4VZHirm',
    staticAccountKeys: [FEE_PAYER],
    version: 0,
} as unknown as VersionedMessage;

const meta = {
    component: SimulatorCard,
    decorators: [withCluster],
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Features/InstructionSimulation/SimulationCard',
} satisfies Meta<typeof SimulatorCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// `useSimulation` is SWR-mutation based — the card stays in idle state until the user clicks Simulate.
export const Idle: Story = {
    args: {
        message: idleMessage,
        showTokenBalanceChanges: false,
    },
};
