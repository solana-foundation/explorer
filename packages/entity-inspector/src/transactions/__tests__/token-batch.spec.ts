import { AccountRole, getBase58Decoder, isSignerRole, isWritableRole, type ReadonlyUint8Array } from '@solana/kit';
import {
    getBatchInstruction,
    getBatchInstructionDataEncoder,
    getTransferInstruction,
    TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';
import { describe, expect, it } from 'vitest';

import { gen } from '../../__tests__/gen.js';
import type { FallbackInstruction } from '../types.js';
import { decodeTokenBatchInstruction, TOKEN_BATCH_DISCRIMINATOR } from '../token-batch.js';

const SOURCE = gen.wrappedSol;
const DESTINATION = gen.sysvarRent;
const AUTHORITY = gen.sysvarClock;
const EXTRA_SIGNER_1 = gen.voteProgram;
const EXTRA_SIGNER_2 = gen.stakeProgram;
const SYSTEM_PROGRAM = gen.systemProgram;

type KitInstructionLike = {
    programAddress: string;
    accounts?: readonly { address: string; role: AccountRole }[];
    data?: ReadonlyUint8Array;
};

function toFallbackInstruction(instruction: KitInstructionLike, programId?: string): FallbackInstruction {
    return {
        accounts: (instruction.accounts ?? []).map(meta => ({
            address: meta.address,
            signer: isSignerRole(meta.role),
            writable: isWritableRole(meta.role),
        })),
        data: getBase58Decoder().decode(instruction.data ?? new Uint8Array()),
        programId: programId ?? instruction.programAddress,
    };
}

function transferInstruction() {
    return getTransferInstruction({ amount: 42n, authority: AUTHORITY, destination: DESTINATION, source: SOURCE });
}

describe('decodeTokenBatchInstruction', () => {
    it('should return undefined for non-token programs', () => {
        const batch = getBatchInstruction([transferInstruction()]);

        expect(decodeTokenBatchInstruction(toFallbackInstruction(batch, SYSTEM_PROGRAM))).toBeUndefined();
    });

    it('should return undefined for token instructions without the batch discriminator', () => {
        const transfer = transferInstruction();

        expect(decodeTokenBatchInstruction(toFallbackInstruction(transfer))).toBeUndefined();
    });

    it('should return undefined for empty instruction data', () => {
        const batch = getBatchInstruction([transferInstruction()]);

        expect(
            decodeTokenBatchInstruction(toFallbackInstruction({ ...batch, data: new Uint8Array() })),
        ).toBeUndefined();
    });

    it('should decode batched transfers with named accounts and typed data', () => {
        const batch = getBatchInstruction([transferInstruction(), transferInstruction()]);

        const decoded = decodeTokenBatchInstruction(toFallbackInstruction(batch));

        expect(decoded).toEqual({
            info: {
                instructions: [
                    {
                        accounts: { authority: AUTHORITY, destination: DESTINATION, source: SOURCE },
                        data: { amount: 42n, discriminator: 3 },
                        extra_signers: [],
                        type: 'Transfer',
                    },
                    {
                        accounts: { authority: AUTHORITY, destination: DESTINATION, source: SOURCE },
                        data: { amount: 42n, discriminator: 3 },
                        extra_signers: [],
                        type: 'Transfer',
                    },
                ],
            },
            program: 'spl-token',
            type: 'batch',
        });
    });

    it('should recover multisig extra signers from raw account slices', () => {
        const transfer = transferInstruction();
        const withCosigners = {
            ...transfer,
            accounts: [
                ...transfer.accounts,
                { address: EXTRA_SIGNER_1, role: AccountRole.READONLY_SIGNER },
                { address: EXTRA_SIGNER_2, role: AccountRole.READONLY_SIGNER },
            ],
        };
        const batch = getBatchInstruction([withCosigners, transferInstruction()]);

        const decoded = decodeTokenBatchInstruction(toFallbackInstruction(batch));

        expect(decoded?.info).toMatchObject({
            instructions: [
                {
                    extra_signers: [
                        { address: EXTRA_SIGNER_1, signer: true, writable: false },
                        { address: EXTRA_SIGNER_2, signer: true, writable: false },
                    ],
                    type: 'Transfer',
                },
                { extra_signers: [], type: 'Transfer' },
            ],
        });
    });

    it('should label token-2022 batches with the spl-token-2022 program', () => {
        const batch = getBatchInstruction([transferInstruction()]);

        const decoded = decodeTokenBatchInstruction(toFallbackInstruction(batch, TOKEN_2022_PROGRAM_ADDRESS));

        expect(decoded).toMatchObject({ program: 'spl-token-2022', type: 'batch' });
    });

    it('should decode a protocol-invalid nested batch sub-instruction without named accounts', () => {
        const nestedData = getBatchInstructionDataEncoder().encode({
            data: [{ instructionData: new Uint8Array([TOKEN_BATCH_DISCRIMINATOR]), numberOfAccounts: 0 }],
        });

        const decoded = decodeTokenBatchInstruction({
            accounts: [],
            data: getBase58Decoder().decode(nestedData),
            programId: TOKEN_PROGRAM_ADDRESS,
        });

        expect(decoded?.info).toMatchObject({
            instructions: [{ accounts: {}, extra_signers: [], type: 'Batch' }],
        });
    });

    it('should decode an empty batch body to zero sub-instructions', () => {
        const decoded = decodeTokenBatchInstruction({
            accounts: [],
            data: getBase58Decoder().decode(new Uint8Array([TOKEN_BATCH_DISCRIMINATOR])),
            programId: TOKEN_PROGRAM_ADDRESS,
        });

        expect(decoded).toEqual({ info: { instructions: [] }, program: 'spl-token', type: 'batch' });
    });

    it('should throw on truncated batch data', () => {
        const malformed: FallbackInstruction = {
            accounts: [],
            // Sub-instruction announces 9 data bytes but the buffer ends — the decoder must throw.
            data: getBase58Decoder().decode(new Uint8Array([TOKEN_BATCH_DISCRIMINATOR, 0, 9])),
            programId: TOKEN_PROGRAM_ADDRESS,
        };

        expect(() => decodeTokenBatchInstruction(malformed)).toThrow();
    });
});
