import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { isMangoInstruction, parseMangoInstructionTitle } from '../detection';
import { MANGO_INSTRUCTION_NAMES } from '../instruction-names';
import { makeInstruction, makeRawInstructionData, MANGO_PROGRAM_IDS } from './fixtures';

describe('isMangoInstruction', () => {
    it.each([
        ['mainnet', MANGO_PROGRAM_IDS.mainnet],
        ['devnet', MANGO_PROGRAM_IDS.devnet],
        ['testnet', MANGO_PROGRAM_IDS.testnet],
    ] as const)('should return true for %s mango program ID', (_network, programId) => {
        const ix = makeInstruction(makeRawInstructionData(0), programId);
        expect(isMangoInstruction(ix)).toBe(true);
    });

    it('should return false for System Program', () => {
        const ix = new TransactionInstruction({
            data: Buffer.alloc(4),
            keys: [],
            programId: SystemProgram.programId,
        });
        expect(isMangoInstruction(ix)).toBe(false);
    });

    it('should return false for unknown program ID', () => {
        const ix = makeInstruction(
            makeRawInstructionData(0),
            new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        );
        expect(isMangoInstruction(ix)).toBe(false);
    });
});

describe('parseMangoInstructionTitle', () => {
    it.each([...MANGO_INSTRUCTION_NAMES.entries()])('should parse discriminator %i to "%s"', (discriminator, name) => {
        const ix = makeInstruction(makeRawInstructionData(discriminator), MANGO_PROGRAM_IDS.mainnet);
        expect(parseMangoInstructionTitle(ix)).toBe(name);
    });

    it('should throw for an unknown discriminator', () => {
        const ix = makeInstruction(makeRawInstructionData(9999), MANGO_PROGRAM_IDS.mainnet);
        expect(() => parseMangoInstructionTitle(ix)).toThrow();
    });
});
