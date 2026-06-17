import { ParsedTransaction, PublicKey } from '@solana/web3.js';
import {
    nextjsParameters,
    withCluster,
    withMockTransactions,
    withScrollAnchor,
    withTokenInfoBatch,
} from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import bs58 from 'bs58';

import { Ed25519DetailsCard } from '../Ed25519DetailsCard';

// Hex bytes encode a valid single-signature Ed25519 instruction layout.
// Source: existing __tests__/Ed25519DetailsCard.test.tsx fixture.
const ix = {
    data: Buffer.from('01000c0001004c0001006e008a000100', 'hex'),
    keys: [],
    programId: new PublicKey('Ed25519SigVerify111111111111111111111111111'),
};

// Surrounding instruction at index 1 — the offsets in `ix.data` point into this instruction's
// bs58-encoded data for signature/pubkey/message bytes. 256 zeros render empty fields without
// requiring a real signed payload.
const surroundingIx = {
    accounts: [],
    data: bs58.encode(Buffer.alloc(256)),
    programId: new PublicKey('11111111111111111111111111111111'),
} as any;

const tx = {
    message: {
        accountKeys: [],
        instructions: [ix as any, surroundingIx],
        recentBlockhash: '',
    },
    signatures: [],
} as unknown as ParsedTransaction;

const meta: Meta<typeof Ed25519DetailsCard> = {
    component: Ed25519DetailsCard,
    decorators: [withCluster, withScrollAnchor, withTokenInfoBatch, withMockTransactions],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Instruction/Ed25519DetailsCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleSignature: Story = {
    args: { childIndex: undefined, index: 0, innerCards: undefined, ix, result: { err: null }, tx },
};

export const Failed: Story = {
    args: {
        childIndex: undefined,
        index: 0,
        innerCards: undefined,
        ix,
        result: { err: { InstructionError: [0, 'Custom'] } },
        tx,
    },
};
