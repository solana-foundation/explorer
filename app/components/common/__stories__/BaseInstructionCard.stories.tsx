import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { nextjsParameters, withCluster, withScrollAnchor, withTokenInfoBatch } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BaseTable } from '@/app/shared/ui/Table';

import { BaseInstructionCard } from '../BaseInstructionCard';

const meta: Meta<typeof BaseInstructionCard> = {
    component: BaseInstructionCard,
    decorators: [withCluster, withScrollAnchor, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
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
        children: (
            <BaseTable.Row>
                <BaseTable.Cell>Instruction details go here</BaseTable.Cell>
            </BaseTable.Row>
        ),
        index: 0,
        ix: sampleIx,
        result: { err: null },
        title: 'Token Transfer',
    },
};

export const Failed: Story = {
    args: {
        children: (
            <BaseTable.Row>
                <BaseTable.Cell>Instruction details go here</BaseTable.Cell>
            </BaseTable.Row>
        ),
        index: 0,
        ix: sampleIx,
        result: { err: { InstructionError: [0, 'Custom'] } },
        title: 'Token Transfer',
    },
};

export const Collapsible: Story = {
    args: {
        children: (
            <BaseTable.Row>
                <BaseTable.Cell>Hidden when collapsed</BaseTable.Cell>
            </BaseTable.Row>
        ),
        collapsible: true,
        index: 1,
        ix: sampleIx,
        result: { err: null },
        title: 'Collapsible Instruction',
    },
};
