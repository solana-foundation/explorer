// Repo's stored PMP Codama IDL mock (not kept in sync with the published IDL) — drives the real decode path.
import pmpIdl from '@entities/idl/mocks/codama/codama-1.0.0-ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S.json';
import { address } from '@solana/kit';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
    getAllocateInstructionDataEncoder,
    getSetAuthorityInstructionDataEncoder,
    PROGRAM_METADATA_PROGRAM_ADDRESS,
} from '@solana-program/program-metadata';
import {
    nextjsParameters,
    withCluster,
    withMockTransactions,
    withScrollAnchor,
    withTokenInfoBatch,
} from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { decodeInstructionWithIdl } from '../../lib/decode-instruction-with-idl';
import { IdlInstructionCard } from '../IdlInstructionCard';

const PROGRAM_ID = new PublicKey(PROGRAM_METADATA_PROGRAM_ADDRESS);
const url = 'https://api.devnet.solana.com';

// Account names are resolved from the IDL by position, so any keys work — only the count and the
// (real) instruction data matter for decoding.
function makeIx(data: Buffer, accountCount: number): TransactionInstruction {
    return new TransactionInstruction({
        data,
        keys: Array.from({ length: accountCount }, () => ({
            isSigner: false,
            isWritable: false,
            pubkey: PublicKey.unique(),
        })),
        programId: PROGRAM_ID,
    });
}

const meta = {
    component: IdlInstructionCard,
    decorators: [withCluster, withScrollAnchor, withTokenInfoBatch, withMockTransactions],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    // TODO(decode-instruction-with-idl): rename to a feature-scoped title once the Storybook tree migration off
    // the Dashkit layout lands; kept stable here to avoid churning the tree mid-move.
    title: 'Components/Instruction/IdlInstructionCard',
} satisfies Meta<typeof IdlInstructionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Real PMP instruction data decoded against the real PMP Codama IDL — exercises the codama decode path
// end-to-end through the dispatcher card (the coverage the retired ProgramMetadataIdl stories provided).
const allocateIx = makeIx(Buffer.from(getAllocateInstructionDataEncoder().encode({ seed: 'idl' })), 5);
export const Allocate: Story = {
    args: {
        decoded: decodeInstructionWithIdl(allocateIx, pmpIdl, url),
        index: 0,
        ix: allocateIx,
        result: { err: null },
        signature: '',
    },
};

const setAuthorityIx = makeIx(
    Buffer.from(getSetAuthorityInstructionDataEncoder().encode({ newAuthority: address(PROGRAM_ID.toBase58()) })),
    5,
);
export const SetAuthority: Story = {
    args: {
        decoded: decodeInstructionWithIdl(setAuthorityIx, pmpIdl, url),
        index: 0,
        ix: setAuthorityIx,
        result: { err: null },
        signature: '',
    },
};
