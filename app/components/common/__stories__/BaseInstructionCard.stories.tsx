import type { Meta, StoryObj } from '@storybook/react';

import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { nextjsParameters, withCluster, withScrollAnchor } from '@storybook-config/decorators';

import { BaseInstructionCard } from '../BaseInstructionCard';

const meta: Meta<typeof BaseInstructionCard> = {
    component: BaseInstructionCard,
    decorators: [withCluster, withScrollAnchor],
    parameters: nextjsParameters,
    title: 'Components/Common/BaseInstructionCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleIx = new TransactionInstruction({
    data: Buffer.from([1, 2, 3, 4]),
    keys: [
        {
            isSigner: true,
            isWritable: true,
            pubkey: new PublicKey('11111111111111111111111111111111'),
        },
    ],
    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
});

export const Success: Story = {
    args: {
        children: <tr><td>Instruction details go here</td></tr>,
        index: 0,
        ix: sampleIx,
        result: { err: null },
        title: 'Token Transfer',
    },
};

export const Failed: Story = {
    args: {
        children: <tr><td>Instruction details go here</td></tr>,
        index: 0,
        ix: sampleIx,
        result: { err: { InstructionError: [0, 'Custom'] } },
        title: 'Token Transfer',
    },
};

export const Collapsible: Story = {
    args: {
        children: <tr><td>Hidden when collapsed</td></tr>,
        collapsible: true,
        index: 1,
        ix: sampleIx,
        result: { err: null },
        title: 'Collapsible Instruction',
    },
};
