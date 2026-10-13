import { address } from '@solana/kit';
import { describe, expect, it } from 'vitest';

import { parseSerumInstructionKey } from '../decoder';
import {
    isDeprecatedSerumProgram,
    isSerumProgramId,
    isUndecodableSerumInstructionName,
    parseSerumInstructionTitle,
    resolveSerumInstructionKey,
    resolveSerumInstructionName,
    SERUM_INSTRUCTION_NAMES,
} from '../detection';
import { OPEN_BOOK_PROGRAM_IDS } from '../program-ids';
import { ENCODED_INSTRUCTIONS, makeInstruction, makeRawInstructionData, SERUM_PROGRAM_IDS_BY_NAME } from './fixtures';

const SYSTEM_PROGRAM = address('11111111111111111111111111111111');
const TOKEN_PROGRAM = address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

describe('isSerumProgramId', () => {
    it.each([
        ['dexV1', SERUM_PROGRAM_IDS_BY_NAME.dexV1],
        ['dexV1b', SERUM_PROGRAM_IDS_BY_NAME.dexV1b],
        ['dexV2', SERUM_PROGRAM_IDS_BY_NAME.dexV2],
        ['dexV3', SERUM_PROGRAM_IDS_BY_NAME.dexV3],
        ['openBook', SERUM_PROGRAM_IDS_BY_NAME.openBook],
    ] as const)('should return true for the %s program id', (_name, programId) => {
        expect(isSerumProgramId(programId)).toBe(true);
    });

    it('should return false for the System Program', () => {
        expect(isSerumProgramId(SYSTEM_PROGRAM)).toBe(false);
    });

    it('should return false for an unrelated SPL program id', () => {
        expect(isSerumProgramId(TOKEN_PROGRAM)).toBe(false);
    });
});

describe('isDeprecatedSerumProgram', () => {
    it.each([
        ['dexV1', SERUM_PROGRAM_IDS_BY_NAME.dexV1],
        ['dexV1b', SERUM_PROGRAM_IDS_BY_NAME.dexV1b],
        ['dexV2', SERUM_PROGRAM_IDS_BY_NAME.dexV2],
        ['dexV3', SERUM_PROGRAM_IDS_BY_NAME.dexV3],
    ] as const)('should return true for the deprecated %s program id', (_name, programId) => {
        expect(isDeprecatedSerumProgram(programId)).toBe(true);
    });

    it('should return false for OpenBook', () => {
        expect(isDeprecatedSerumProgram(OPEN_BOOK_PROGRAM_IDS.mainnet)).toBe(false);
    });

    it('should return false for an unrelated program id', () => {
        expect(isDeprecatedSerumProgram('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')).toBe(false);
    });
});

describe('isUndecodableSerumInstructionName', () => {
    it.each(['disableMarket', 'sweepFees', 'newOrderV2', 'sendTake'] as const)(
        'should return true for %s, which has no vendored layout',
        name => {
            expect(isUndecodableSerumInstructionName(name)).toBe(true);
        },
    );

    it.each(['newOrderV3', 'cancelOrder', 'settleFunds'] as const)('should return false for decodable %s', name => {
        expect(isUndecodableSerumInstructionName(name)).toBe(false);
    });

    it('should cover exactly the names the decoder cannot parse', () => {
        const undecodable = Object.keys(SERUM_INSTRUCTION_NAMES).filter(name =>
            isUndecodableSerumInstructionName(name as keyof typeof SERUM_INSTRUCTION_NAMES),
        );
        const decodable = Object.keys(ENCODED_INSTRUCTIONS);

        expect(undecodable.sort()).toEqual(['disableMarket', 'newOrderV2', 'sendTake', 'sweepFees']);
        expect([...undecodable, ...decodable].sort()).toEqual(Object.keys(SERUM_INSTRUCTION_NAMES).sort());
    });
});

describe('resolveSerumInstructionKey', () => {
    it.each([
        [7, 'disableMarket'],
        [8, 'sweepFees'],
        [9, 'newOrderV2'],
        [10, 'newOrderV3'],
        [13, 'sendTake'],
    ] as const)('should map code %i to "%s"', (code, expected) => {
        expect(resolveSerumInstructionKey(makeRawInstructionData(code))).toBe(expected);
    });

    it.each(Object.keys(ENCODED_INSTRUCTIONS) as (keyof typeof ENCODED_INSTRUCTIONS)[])(
        'should agree with the instruction layout for an encoded %s instruction',
        key => {
            const ix = makeInstruction(ENCODED_INSTRUCTIONS[key], SERUM_PROGRAM_IDS_BY_NAME.openBook);
            expect(resolveSerumInstructionKey(ix.data)).toBe(parseSerumInstructionKey(ix));
        },
    );

    it('should return undefined for an unknown instruction code', () => {
        expect(resolveSerumInstructionKey(makeRawInstructionData(255))).toBeUndefined();
    });

    it('should return undefined without throwing for data shorter than 5 bytes', () => {
        expect(resolveSerumInstructionKey(new Uint8Array(0))).toBeUndefined();
        expect(resolveSerumInstructionKey(new Uint8Array([0, 2]))).toBeUndefined();
    });
});

describe('SERUM_INSTRUCTION_NAMES', () => {
    it('should title every named code, including the four with no vendored layout', () => {
        const keys = Array.from({ length: 18 }, (_, code) => resolveSerumInstructionKey(makeRawInstructionData(code)));

        expect(keys).not.toContain(undefined);
        expect(new Set(keys).size).toBe(18);
        expect(Object.keys(SERUM_INSTRUCTION_NAMES).sort()).toEqual([...keys].sort());
    });
});

describe('resolveSerumInstructionName', () => {
    it('should resolve the instruction name from a program id and discriminator', () => {
        expect(resolveSerumInstructionName(OPEN_BOOK_PROGRAM_IDS.mainnet, makeRawInstructionData(2))).toBe(
            'Match Orders',
        );
    });

    it('should resolve for deprecated serum program ids', () => {
        expect(resolveSerumInstructionName(SERUM_PROGRAM_IDS_BY_NAME.dexV3, makeRawInstructionData(10))).toBe(
            'New Order v3',
        );
    });

    it('should return undefined for an unrelated program id', () => {
        expect(
            resolveSerumInstructionName('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', makeRawInstructionData(2)),
        ).toBeUndefined();
    });

    it('should return undefined when the discriminator is shorter than 5 bytes', () => {
        expect(resolveSerumInstructionName(OPEN_BOOK_PROGRAM_IDS.mainnet, new Uint8Array([0, 2]))).toBeUndefined();
    });

    it('should return undefined for an unknown instruction code', () => {
        expect(resolveSerumInstructionName(OPEN_BOOK_PROGRAM_IDS.mainnet, makeRawInstructionData(255))).toBeUndefined();
    });
});

describe('parseSerumInstructionTitle', () => {
    it.each([
        [0, 'Initialize Market'],
        [1, 'New Order'],
        [2, 'Match Orders'],
        [3, 'Consume Events'],
        [4, 'Cancel Order'],
        [5, 'Settle Funds'],
        [6, 'Cancel Order by Client Id'],
        [7, 'Disable Market'],
        [8, 'Sweep Fees'],
        [9, 'New Order v2'],
        [10, 'New Order v3'],
        [11, 'Cancel Order v2'],
        [12, 'Cancel Order by Client Id v2'],
        [13, 'Send Take'],
        [14, 'Close Open Orders'],
        [15, 'Init Open Orders'],
        [16, 'Prune'],
        [17, 'Consume Events Permissioned'],
    ] as const)('should map code %i to "%s"', (code, expected) => {
        expect(parseSerumInstructionTitle(SERUM_PROGRAM_IDS_BY_NAME.openBook, makeRawInstructionData(code))).toBe(
            expected,
        );
    });

    it('should throw on an unknown instruction code', () => {
        expect(() =>
            parseSerumInstructionTitle(SERUM_PROGRAM_IDS_BY_NAME.openBook, makeRawInstructionData(255)),
        ).toThrow('Unrecognized Serum instruction code: 255');
    });

    it('should throw on data too short to hold an instruction code', () => {
        expect(() => parseSerumInstructionTitle(SERUM_PROGRAM_IDS_BY_NAME.openBook, new Uint8Array([0, 2]))).toThrow(
            'Serum instruction data too short (2 bytes)',
        );
    });
});
