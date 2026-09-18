import { createInstructionParserDispatcher, isParsedInstruction } from '@entities/instruction-parser';
import { AccountRole, address } from '@solana/kit';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { zkElGamalProofInstructionParser } from '../zk-elgamal-proof-client';
import {
    parseZkElGamalProofInstruction,
    ZK_ELGAMAL_PROOF_PROGRAM_ADDRESS,
    ZK_ELGAMAL_PROOF_PROGRAM_LABEL,
} from '../zk-elgamal-proof-parser';

const CONTEXT_STATE = address('FagABcRBhZH27JDtu6A1Jo9woXyoznP28QujLkxkN9Hj');
const AUTHORITY = address('7txXZZD6Um59YoLMF7XUNimbMjsqsWhc7g2EniiTrmp1');
const RECORD = address('GgU1RSCbCTNfjPqBGnR7NBDZoLQwB7oEjnHqzGtcCLBH');

/** discriminator 3 = Verify Ciphertext-Commitment Equality */
const VERIFY_DISCRIMINATOR = 3;

function parse(data: number[], accounts: ReturnType<typeof address>[] = []) {
    return parseZkElGamalProofInstruction({
        accounts: accounts.map(account => ({ address: account, role: AccountRole.READONLY })),
        data: new Uint8Array(data),
        programAddress: ZK_ELGAMAL_PROOF_PROGRAM_ADDRESS,
    });
}

describe('parseZkElGamalProofInstruction', () => {
    it('should decode Close Context State with its three named accounts', () => {
        expect(parse([0], [CONTEXT_STATE, RECORD, AUTHORITY])).toEqual({
            info: { authority: AUTHORITY, contextState: CONTEXT_STATE, destination: RECORD },
            type: 'CloseContextState',
        });
    });

    it('should reject Close Context State that is short an account rather than throw', () => {
        expect(parse([0], [CONTEXT_STATE, RECORD])).toBeUndefined();
    });

    it('should decode a verify instruction that carries its proof inline', () => {
        expect(parse([VERIFY_DISCRIMINATOR, 10, 20, 30])).toEqual({
            info: {
                contextState: undefined,
                contextStateAuthority: undefined,
                name: 'Verify Ciphertext-Commitment Equality',
                offset: undefined,
                proofByteLength: 3,
                recordAccount: undefined,
            },
            type: 'VerifyProof',
        });
    });

    // A five-byte instruction is `[discriminator, u32 offset]`: the proof lives in the record account.
    it('should decode a verify instruction that reads its proof from a record account', () => {
        const parsed = parse([VERIFY_DISCRIMINATOR, 8, 0, 0, 0], [RECORD, CONTEXT_STATE, AUTHORITY]);

        expect(parsed?.type).toBe('VerifyProof');
        expect(parsed?.info).toEqual({
            contextState: CONTEXT_STATE,
            contextStateAuthority: AUTHORITY,
            name: 'Verify Ciphertext-Commitment Equality',
            offset: 8,
            proofByteLength: undefined,
            recordAccount: RECORD,
        });
    });

    it('should name the context state pair when the proof is inline', () => {
        const parsed = parse([VERIFY_DISCRIMINATOR, 1, 2], [CONTEXT_STATE, AUTHORITY]);

        expect(parsed?.info).toMatchObject({
            contextState: CONTEXT_STATE,
            contextStateAuthority: AUTHORITY,
            recordAccount: undefined,
        });
    });

    it('should return undefined for a discriminator past the known instructions', () => {
        expect(parse([13])).toBeUndefined();
    });

    it('should return undefined for empty data', () => {
        expect(parse([])).toBeUndefined();
    });
});

describe('zkElGamalProofInstructionParser', () => {
    const dispatcher = createInstructionParserDispatcher([zkElGamalProofInstructionParser]);

    it('should register under the ZK ElGamal Proof program id and label', () => {
        expect(dispatcher.canHandle(ZK_ELGAMAL_PROOF_PROGRAM_ADDRESS)).toBe(true);

        const dispatched = dispatcher.fromTransactionInstruction(
            new TransactionInstruction({
                data: Buffer.from([VERIFY_DISCRIMINATOR, 1]),
                keys: [],
                programId: new PublicKey(ZK_ELGAMAL_PROOF_PROGRAM_ADDRESS),
            }),
        );

        expect(dispatched && isParsedInstruction(dispatched)).toBe(true);
        expect(dispatched && 'program' in dispatched && dispatched.program).toBe(ZK_ELGAMAL_PROOF_PROGRAM_LABEL);
    });

    it('should report an unknown discriminator as registered-but-unparsed', () => {
        const dispatched = dispatcher.fromTransactionInstruction(
            new TransactionInstruction({
                data: Buffer.from([99]),
                keys: [],
                programId: new PublicKey(ZK_ELGAMAL_PROOF_PROGRAM_ADDRESS),
            }),
        );

        expect(dispatched).toMatchObject({ programLabel: ZK_ELGAMAL_PROOF_PROGRAM_LABEL, unknown: true });
    });
});
