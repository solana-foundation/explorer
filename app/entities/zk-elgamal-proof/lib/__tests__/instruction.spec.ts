import { PublicKey, type TransactionInstruction } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import {
    getZkElGamalProofAccountLabel,
    getZkElGamalProofInstructionName,
    isZkElGamalProofInstruction,
    isZkElGamalProofProgram,
    parseZkElGamalProofInstruction,
    resolveZkElGamalProofName,
} from '../instruction';

const ZK_PROGRAM_ID = new PublicKey('ZkE1Gama1Proof11111111111111111111111111111');

describe('getZkElGamalProofInstructionName', () => {
    it('should resolve a known discriminator to its instruction name', () => {
        // discriminator 3 = Verify Ciphertext-Commitment Equality
        expect(getZkElGamalProofInstructionName(3)).toBe('Verify Ciphertext-Commitment Equality');
    });

    it('should fall back to Unknown Instruction for an out-of-range discriminator', () => {
        expect(getZkElGamalProofInstructionName(99)).toBe('Unknown Instruction');
    });

    it('should fall back to Unknown Instruction for the empty-data sentinel (-1)', () => {
        expect(getZkElGamalProofInstructionName(-1)).toBe('Unknown Instruction');
    });
});

describe('isZkElGamalProofProgram', () => {
    it('should return true for the ZK ElGamal Proof program id', () => {
        expect(isZkElGamalProofProgram(ZK_PROGRAM_ID.toBase58())).toBe(true);
    });

    it('should return false for any other program id', () => {
        expect(isZkElGamalProofProgram(PublicKey.default.toBase58())).toBe(false);
    });
});

describe('isZkElGamalProofInstruction', () => {
    it('should return true for an instruction on the ZK ElGamal Proof program', () => {
        expect(isZkElGamalProofInstruction({ programId: ZK_PROGRAM_ID } as TransactionInstruction)).toBe(true);
    });

    it('should return false for any other program', () => {
        const other = { programId: PublicKey.default } as TransactionInstruction;
        expect(isZkElGamalProofInstruction(other)).toBe(false);
    });
});

describe('resolveZkElGamalProofName', () => {
    it('should name a ZK ElGamal instruction from its raw data', () => {
        // discriminator 3 = Verify Ciphertext-Commitment Equality
        expect(resolveZkElGamalProofName(ZK_PROGRAM_ID.toBase58(), new Uint8Array([3]))).toBe(
            'Verify Ciphertext-Commitment Equality',
        );
    });

    it('should return undefined for a non-ZK program so a caller can fall through to other resolvers', () => {
        expect(resolveZkElGamalProofName(PublicKey.default.toBase58(), new Uint8Array([3]))).toBeUndefined();
    });

    it('should fall back to Unknown Instruction for empty data on the ZK program', () => {
        expect(resolveZkElGamalProofName(ZK_PROGRAM_ID.toBase58(), new Uint8Array([]))).toBe('Unknown Instruction');
    });
});

describe('parseZkElGamalProofInstruction', () => {
    it('should parse the discriminator, name, and proof byte length', () => {
        expect(parseZkElGamalProofInstruction(new Uint8Array([3, 10, 20, 30]))).toEqual({
            discriminator: 3,
            isCloseContextState: false,
            name: 'Verify Ciphertext-Commitment Equality',
            proofByteLength: 3,
        });
    });

    it('should flag Close Context State (discriminator 0) with no proof bytes', () => {
        expect(parseZkElGamalProofInstruction(new Uint8Array([0]))).toEqual({
            discriminator: 0,
            isCloseContextState: true,
            name: 'Close Context State',
            proofByteLength: 0,
        });
    });

    it('should use the -1 sentinel for empty data', () => {
        const parsed = parseZkElGamalProofInstruction(new Uint8Array([]));
        expect(parsed.discriminator).toBe(-1);
        expect(parsed.name).toBe('Unknown Instruction');
        expect(parsed.proofByteLength).toBe(0);
    });
});

describe('getZkElGamalProofAccountLabel', () => {
    it('should label the Close Context State account layout', () => {
        const opts = { accountCount: 3, isCloseContextState: true };
        expect(getZkElGamalProofAccountLabel(0, opts)).toBe('Context State Account');
        expect(getZkElGamalProofAccountLabel(1, opts)).toBe('Destination');
        expect(getZkElGamalProofAccountLabel(2, opts)).toBe('Authority');
    });

    it('should label a single record account for the verify-with-record layout', () => {
        expect(getZkElGamalProofAccountLabel(0, { accountCount: 1, isCloseContextState: false })).toBe(
            'Record Account',
        );
    });

    it('should label the context-state account layout', () => {
        const opts = { accountCount: 2, isCloseContextState: false };
        expect(getZkElGamalProofAccountLabel(0, opts)).toBe('Context State Account');
        expect(getZkElGamalProofAccountLabel(1, opts)).toBe('Context State Authority');
    });

    it('should fall back to a numbered label outside the known layouts', () => {
        expect(getZkElGamalProofAccountLabel(4, { accountCount: 5, isCloseContextState: false })).toBe('Account #5');
    });
});
