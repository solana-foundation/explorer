import { type ParsedInstruction, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { withClusterAndAccounts, withScrollAnchor, withTokenInfoBatch } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { BaseTable } from '@/app/shared/ui/Table';

import { InspectorInstructionCard } from '../InspectorInstructionCard';

const programId = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

const transactionIx = new TransactionInstruction({
    data: Buffer.from([1, 2, 3, 4]),
    keys: [{ isSigner: true, isWritable: true, pubkey: new PublicKey('11111111111111111111111111111111') }],
    programId,
});

const parsedIx: ParsedInstruction = {
    parsed: {
        info: {
            destination: '8Vw25ZackDzaJzzBBqcgcpDsCsDfRSkMGgwFQ3gbReWF',
            lamports: 1_000_000_000,
            source: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        },
        type: 'transfer',
    },
    program: 'system',
    programId,
} as any;

const meta: Meta<typeof InspectorInstructionCard> = {
    component: InspectorInstructionCard,
    decorators: [withScrollAnchor, withTokenInfoBatch, withClusterAndAccounts],
    tags: ['autodocs', 'test'],
    title: 'Components/Common/InspectorInstructionCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
    args: {
        children: (
            <BaseTable.Row>
                <BaseTable.Cell>Decoded instruction details</BaseTable.Cell>
            </BaseTable.Row>
        ),
        index: 0,
        ix: parsedIx,
        result: { err: null },
        title: 'System Transfer',
    },
};

export const Failed: Story = {
    args: {
        children: (
            <BaseTable.Row>
                <BaseTable.Cell>Decoded instruction details</BaseTable.Cell>
            </BaseTable.Row>
        ),
        index: 0,
        ix: parsedIx,
        result: { err: { InstructionError: [0, 'Custom'] } },
        title: 'System Transfer',
    },
};

export const RawByDefault: Story = {
    args: {
        children: null,
        defaultRaw: true,
        index: 0,
        ix: transactionIx,
        result: { err: null },
        title: 'Raw Token Instruction',
    },
};
