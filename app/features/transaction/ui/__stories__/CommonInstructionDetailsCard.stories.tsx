import { PublicKey, type TransactionInstruction } from '@solana/web3.js';
import {
    nextjsParameters,
    withCluster,
    withMockTransactions,
    withScrollAnchor,
    withTokenInfoBatch,
} from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { CommonInstructionDetailsCard } from '../CommonInstructionDetailsCard';

// Renders "<program label>: <instruction>" over the raw instruction data — the label resolved from the program
// registry, the instruction name supplied by the caller.
function makeIx(programId: string, data: number[]): TransactionInstruction {
    return {
        data: Buffer.from(data),
        keys: [],
        programId: new PublicKey(programId),
    } as unknown as TransactionInstruction;
}

const meta: Meta<typeof CommonInstructionDetailsCard> = {
    component: CommonInstructionDetailsCard,
    decorators: [withCluster, withScrollAnchor, withTokenInfoBatch, withMockTransactions],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/Transaction/CommonInstructionDetailsCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

// A program the registry names.
export const RecognizedProgram: Story = {
    args: {
        childIndex: undefined,
        index: 0,
        innerCards: undefined,
        instructionName: 'Advance Nonce Account',
        ix: makeIx('11111111111111111111111111111111', [4, 0, 0, 0]),
        result: { err: null },
    },
};

// A program the registry doesn't know: the label falls back to "Unknown Program (address)".
export const UnrecognizedProgram: Story = {
    args: {
        childIndex: undefined,
        index: 0,
        innerCards: undefined,
        instructionName: 'Deposit',
        ix: makeIx('So11111111111111111111111111111111111111112', [1, 0, 0, 0]),
        result: { err: null },
    },
};
