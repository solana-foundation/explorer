import { address } from '@solana/kit';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { describe, expect, it } from 'vitest';

import { isMangoProgramId, parseMangoInstructionTitle, resolveMangoInstructionName } from '../detection';
import { MANGO_INSTRUCTION_NAMES } from '../instruction-names';
import { makeRawInstructionData, MANGO_PROGRAM_IDS } from './fixtures';

const SYSTEM_PROGRAM = address('11111111111111111111111111111111');

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

describe('isMangoProgramId', () => {
    it.each([
        ['mainnet', MANGO_PROGRAM_IDS.mainnet],
        ['devnet', MANGO_PROGRAM_IDS.devnet],
        ['testnet', MANGO_PROGRAM_IDS.testnet],
    ] as const)('should return true for %s mango program ID', (_network, programId) => {
        expect(isMangoProgramId(programId)).toBe(true);
    });

    it('should return false for System Program', () => {
        expect(isMangoProgramId(SYSTEM_PROGRAM)).toBe(false);
    });

    it('should return false for unknown program ID', () => {
        expect(isMangoProgramId(TOKEN_PROGRAM_ADDRESS)).toBe(false);
    });
});

describe('parseMangoInstructionTitle', () => {
    it.each([...MANGO_INSTRUCTION_NAMES.entries()])('should parse discriminator %i to "%s"', (discriminator, name) => {
        expect(parseMangoInstructionTitle(MANGO_PROGRAM_IDS.mainnet, makeRawInstructionData(discriminator))).toBe(name);
    });

    it('should throw for an unknown discriminator', () => {
        expect(() => parseMangoInstructionTitle(MANGO_PROGRAM_IDS.mainnet, makeRawInstructionData(9999))).toThrow();
    });
});

describe('resolveMangoInstructionName', () => {
    it.each([...MANGO_INSTRUCTION_NAMES.entries()])(
        'should resolve discriminator %i to "%s"',
        (discriminator, name) => {
            const data = makeRawInstructionData(discriminator);
            expect(resolveMangoInstructionName(MANGO_PROGRAM_IDS.mainnet, data)).toBe(name);
        },
    );

    it('should return undefined for a non-mango program ID', () => {
        const data = makeRawInstructionData(0);
        expect(resolveMangoInstructionName(TOKEN_PROGRAM_ADDRESS, data)).toBeUndefined();
    });

    it('should return undefined for an unknown discriminator', () => {
        const data = makeRawInstructionData(9999);
        expect(resolveMangoInstructionName(MANGO_PROGRAM_IDS.mainnet, data)).toBeUndefined();
    });

    it('should return undefined when data is shorter than the discriminator', () => {
        expect(resolveMangoInstructionName(MANGO_PROGRAM_IDS.mainnet, new Uint8Array([0, 0]))).toBeUndefined();
    });
});
