import { describe, expect, it } from 'vitest';

import { getZkElGamalProofInstructionName, isZkElGamalProofProgram, resolveZkElGamalProofName } from '../instruction';

const ZK_PROGRAM_ID = 'ZkE1Gama1Proof11111111111111111111111111111';
const OTHER_PROGRAM_ID = '11111111111111111111111111111111';

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
        expect(isZkElGamalProofProgram(ZK_PROGRAM_ID)).toBe(true);
    });

    it('should return false for any other program id', () => {
        expect(isZkElGamalProofProgram(OTHER_PROGRAM_ID)).toBe(false);
    });
});

describe('resolveZkElGamalProofName', () => {
    it('should name a ZK ElGamal instruction from its raw data', () => {
        // discriminator 3 = Verify Ciphertext-Commitment Equality
        expect(resolveZkElGamalProofName(ZK_PROGRAM_ID, new Uint8Array([3]))).toBe(
            'Verify Ciphertext-Commitment Equality',
        );
    });

    it('should return undefined for a non-ZK program so a caller can fall through to other resolvers', () => {
        expect(resolveZkElGamalProofName(OTHER_PROGRAM_ID, new Uint8Array([3]))).toBeUndefined();
    });

    // The resolver must not answer "Unknown Instruction" here. That is a caller's fallback label, and
    // returning it as a name would both stop the rest of the chain and read as a resolved name to the
    // CU chart, which renders its own positional fallback instead.
    it('should return undefined for empty data on the ZK program', () => {
        expect(resolveZkElGamalProofName(ZK_PROGRAM_ID, new Uint8Array([]))).toBeUndefined();
    });

    it('should return undefined for a discriminator past the known instructions', () => {
        expect(resolveZkElGamalProofName(ZK_PROGRAM_ID, new Uint8Array([99]))).toBeUndefined();
    });
});
