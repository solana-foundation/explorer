import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { describe, expect, it } from 'vitest';

import {
    getMangoInstructionLabel,
    isMangoInstruction,
    parseMangoInstructionTitle,
    resolveMangoInstructionName,
} from '../detection';
import { MANGO_INSTRUCTION_NAMES } from '../instruction-names';
import { makeInstruction, makeRawInstructionData, MANGO_PROGRAM_IDS } from './fixtures';

// The name table is hand-maintained (no longer cross-checked against @blockworks-foundation/mango-client).
// These literal assertions — not derived from the map — catch a wrong/dropped/shifted entry from a future edit.
describe('MANGO_INSTRUCTION_NAMES', () => {
    it('should keep the expected size and boundary entries', () => {
        expect(MANGO_INSTRUCTION_NAMES.size).toBe(73);
        expect(MANGO_INSTRUCTION_NAMES.get(0)).toBe('InitMangoGroup');
        expect(MANGO_INSTRUCTION_NAMES.get(12)).toBe('PlacePerpOrder');
        expect(MANGO_INSTRUCTION_NAMES.get(41)).toBe('PlaceSpotOrder2');
        expect(MANGO_INSTRUCTION_NAMES.get(73)).toBe('ForceSettlePerpPosition');
        expect(MANGO_INSTRUCTION_NAMES.has(40)).toBe(false);
    });
});

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
        const ix = makeInstruction(makeRawInstructionData(0), new PublicKey(TOKEN_PROGRAM_ADDRESS));
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

describe('resolveMangoInstructionName', () => {
    it.each([...MANGO_INSTRUCTION_NAMES.entries()])(
        'should resolve discriminator %i to "%s"',
        (discriminator, name) => {
            const data = new Uint8Array(makeRawInstructionData(discriminator));
            expect(resolveMangoInstructionName(MANGO_PROGRAM_IDS.mainnet, data)).toBe(name);
        },
    );

    it('should return undefined for a non-mango program ID', () => {
        const data = new Uint8Array(makeRawInstructionData(0));
        expect(resolveMangoInstructionName(TOKEN_PROGRAM_ADDRESS, data)).toBeUndefined();
    });

    it('should return undefined for an unknown discriminator', () => {
        const data = new Uint8Array(makeRawInstructionData(9999));
        expect(resolveMangoInstructionName(MANGO_PROGRAM_IDS.mainnet, data)).toBeUndefined();
    });

    it('should return undefined when data is shorter than the discriminator', () => {
        expect(resolveMangoInstructionName(MANGO_PROGRAM_IDS.mainnet, new Uint8Array([0, 0]))).toBeUndefined();
    });
});

describe('getMangoInstructionLabel', () => {
    it('should return the resolved name for a known discriminator', () => {
        const ix = makeInstruction(makeRawInstructionData(12), MANGO_PROGRAM_IDS.mainnet);
        expect(getMangoInstructionLabel(ix)).toBe(MANGO_INSTRUCTION_NAMES.get(12));
    });

    it('should return "No data" when the instruction has no data', () => {
        const ix = makeInstruction(Buffer.alloc(0), MANGO_PROGRAM_IDS.mainnet);
        expect(getMangoInstructionLabel(ix)).toBe('No data');
    });

    it('should return "Unknown" for an unknown discriminator', () => {
        const ix = makeInstruction(makeRawInstructionData(9999), MANGO_PROGRAM_IDS.mainnet);
        expect(getMangoInstructionLabel(ix)).toBe('Unknown');
    });
});
