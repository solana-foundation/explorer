import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
    nextjsParameters,
    withCluster,
    withClusterAndAccounts,
    withScrollAnchor,
    withTokenInfoBatch,
} from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BaseTable } from '@/app/shared/ui/Table';

import { toInstructionNode } from '../../model/node';
import { BaseInstructionCard } from '../BaseInstructionCard';

const meta = {
    args: { collapsible: false, rawSource: { kind: 'none' }, result: { err: null }, validateProgram: false },
    component: BaseInstructionCard,
    decorators: [withCluster, withScrollAnchor, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Entities/Instruction Card/BaseInstructionCard',
} satisfies Meta<typeof BaseInstructionCard>;

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
        node: toInstructionNode({ index: 0, ix: sampleIx }),
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
        node: toInstructionNode({ index: 0, ix: sampleIx }),
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
        node: toInstructionNode({ index: 1, ix: sampleIx }),
        title: 'Collapsible Instruction',
    },
};

export const ValidatedProgram: Story = {
    args: {
        node: toInstructionNode({ index: 0, ix: sampleIx }),
        title: 'Inspected Instruction',
        validateProgram: true,
    },
    decorators: [withClusterAndAccounts],
};
