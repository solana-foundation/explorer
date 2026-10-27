import { DEFAULT_SIGNATURE } from '@__fixtures__/gen';
import { InstructionNodeCard } from '@components/instruction/InstructionNodeCard';
import {
    instructionDataOf,
    toInstructionNode,
    toRawInstructionNode,
    TxInstructionSurface,
} from '@entities/instruction-card';
import { createInstructionParserDispatcher } from '@entities/instruction-parser';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
    nextjsParameters,
    withCluster,
    withMockTransactions,
    withScrollAnchor,
    withTokenInfoBatch,
    withTxInstructionSurface,
} from '@storybook-config/decorators';
import type { Decorator, Meta, StoryObj } from '@storybook-config/types';

import { invariant } from '@/app/shared/lib/invariant';

import { ed25519InstructionParser } from '../../lib/ed25519-client';
import { Ed25519DetailsCard } from '../Ed25519DetailsCard';

// Hex bytes encode a valid single-signature Ed25519 instruction layout.
// Source: existing __tests__/Ed25519DetailsCard.test.tsx fixture.
const ix = new TransactionInstruction({
    data: Buffer.from('01000c0001004c0001006e008a000100', 'hex'),
    keys: [],
    programId: new PublicKey('Ed25519SigVerify111111111111111111111111111'),
});

// Surrounding instruction at index 1 — the offsets in `ix.data` point into this instruction's data for
// signature/pubkey/message bytes. 256 zeros render empty fields without requiring a real signed payload.
const surroundingIx = new TransactionInstruction({
    data: Buffer.alloc(256),
    keys: [],
    programId: new PublicKey('11111111111111111111111111111111'),
});

const siblingData = instructionDataOf(
    [ix, surroundingIx].map((instruction, index) => toInstructionNode({ index, ix: instruction })),
);

/** The transaction's result reaches the card through the surface, so a failed one needs its own. */
const withFailedInstructionSurface: Decorator = Story => (
    <TxInstructionSurface
        result={{ err: { InstructionError: [0, 'Custom'] } }}
        signature={DEFAULT_SIGNATURE}
        Card={InstructionNodeCard}
        instructionData={siblingData}
    >
        <Story />
    </TxInstructionSurface>
);

const meta: Meta<typeof Ed25519DetailsCard> = {
    component: Ed25519DetailsCard,
    decorators: [withCluster, withScrollAnchor, withTokenInfoBatch, withMockTransactions, withTxInstructionSurface],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Instruction/Ed25519DetailsCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

const dispatched = createInstructionParserDispatcher([ed25519InstructionParser]).fromTransactionInstruction(ix);
invariant(dispatched, 'the fixture program id is registered');

const args = {
    ix: dispatched,
    node: toRawInstructionNode({ index: 0, ix }),
    siblingData,
};

export const SingleSignature: Story = { args };

export const Failed: Story = { args, decorators: [withFailedInstructionSurface] };
