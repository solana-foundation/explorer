import { ScrollAnchorProvider } from '@providers/scroll-anchor';
import { type ParsedInstruction, PublicKey, TransactionInstruction, type VersionedMessage } from '@solana/web3.js';
import type { Decorator, Meta, StoryObj } from '@storybook/nextjs-vite';
import { MockAccountsProvider } from '@storybook-config/__mocks__/MockAccountsProvider';
import { MockClusterProvider } from '@storybook-config/__mocks__/MockClusterProvider';
import { MockTokenInfoBatchProvider } from '@storybook-config/__mocks__/MockTokenInfoBatchProvider';
import { nextjsParameters } from '@storybook-config/decorators';

import { BaseTable } from '@/app/shared/ui/Table';

import { InspectorInstructionCard } from '../InspectorInstructionCard';

const withInspectorProviders: Decorator = Story => (
    <MockClusterProvider>
        <MockAccountsProvider>
            <MockTokenInfoBatchProvider>
                <ScrollAnchorProvider>
                    <Story />
                </ScrollAnchorProvider>
            </MockTokenInfoBatchProvider>
        </MockAccountsProvider>
    </MockClusterProvider>
);

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

// Card forwards `message` without rendering it; an empty placeholder is enough.
const message = {} as VersionedMessage;

const meta: Meta<typeof InspectorInstructionCard> = {
    component: InspectorInstructionCard,
    decorators: [withInspectorProviders],
    parameters: nextjsParameters,
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
        message,
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
        message,
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
        message,
        result: { err: null },
        title: 'Raw Token Instruction',
    },
};
