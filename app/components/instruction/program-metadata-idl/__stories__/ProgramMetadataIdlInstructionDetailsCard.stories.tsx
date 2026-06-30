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

import { ProgramMetadataIdlInstructionDetailsCard } from '../ProgramMetadataIdlInstructionDetailsCard';

const PROGRAM_ID = new PublicKey(PROGRAM_METADATA_PROGRAM_ADDRESS);

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
    component: ProgramMetadataIdlInstructionDetailsCard,
    decorators: [withCluster, withScrollAnchor, withTokenInfoBatch, withMockTransactions],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Instruction/ProgramMetadataIdlInstructionDetailsCard',
} satisfies Meta<typeof ProgramMetadataIdlInstructionDetailsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Allocate: Story = {
    args: {
        idl: pmpIdl,
        index: 0,
        ix: makeIx(Buffer.from(getAllocateInstructionDataEncoder().encode({ seed: 'idl' })), 5),
        result: { err: null },
    },
};

export const SetAuthority: Story = {
    args: {
        idl: pmpIdl,
        index: 0,
        ix: makeIx(
            Buffer.from(
                getSetAuthorityInstructionDataEncoder().encode({ newAuthority: address(PROGRAM_ID.toBase58()) }),
            ),
            5,
        ),
        result: { err: null },
    },
};
