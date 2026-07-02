import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import {
    getSerumInstructionLabel,
    isDeprecatedSerumProgram,
    isSerumInstruction,
    parseSerumInstructionCode,
    parseSerumInstructionTitle,
    resolveSerumInstructionName,
} from '../detection';
import { OPEN_BOOK_PROGRAM_ID } from '../program-ids';
import { ENCODED_INSTRUCTIONS, makeInstruction, makeRawInstructionData, SERUM_PROGRAM_IDS_BY_NAME } from './fixtures';

describe('isSerumInstruction', () => {
    it.each([
        ['dexV1', SERUM_PROGRAM_IDS_BY_NAME.dexV1],
        ['dexV1b', SERUM_PROGRAM_IDS_BY_NAME.dexV1b],
        ['dexV2', SERUM_PROGRAM_IDS_BY_NAME.dexV2],
        ['dexV3', SERUM_PROGRAM_IDS_BY_NAME.dexV3],
        ['openBook', SERUM_PROGRAM_IDS_BY_NAME.openBook],
    ] as const)('should return true for the %s program id', (_name, programId) => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.matchOrders, programId);
        expect(isSerumInstruction(ix)).toBe(true);
    });

    it('should return false for the System Program', () => {
        const ix = new TransactionInstruction({
            data: Buffer.alloc(5),
            keys: [],
            programId: SystemProgram.programId,
        });
        expect(isSerumInstruction(ix)).toBe(false);
    });

    it('should return false for an unrelated SPL program id', () => {
        const ix = makeInstruction(
            ENCODED_INSTRUCTIONS.matchOrders,
            new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        );
        expect(isSerumInstruction(ix)).toBe(false);
    });
});

describe('isDeprecatedSerumProgram', () => {
    it.each([
        ['dexV1', SERUM_PROGRAM_IDS_BY_NAME.dexV1],
        ['dexV1b', SERUM_PROGRAM_IDS_BY_NAME.dexV1b],
        ['dexV2', SERUM_PROGRAM_IDS_BY_NAME.dexV2],
        ['dexV3', SERUM_PROGRAM_IDS_BY_NAME.dexV3],
    ] as const)('should return true for the deprecated %s program id', (_name, programId) => {
        expect(isDeprecatedSerumProgram(programId.toBase58())).toBe(true);
    });

    it('should return false for OpenBook', () => {
        expect(isDeprecatedSerumProgram(OPEN_BOOK_PROGRAM_ID)).toBe(false);
    });

    it('should return false for an unrelated program id', () => {
        expect(isDeprecatedSerumProgram('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')).toBe(false);
    });
});

describe('parseSerumInstructionCode', () => {
    it.each([
        ['initializeMarket', 0],
        ['newOrder', 1],
        ['matchOrders', 2],
        ['consumeEvents', 3],
        ['cancelOrder', 4],
        ['settleFunds', 5],
        ['cancelOrderByClientId', 6],
        ['newOrderV3', 10],
        ['cancelOrderV2', 11],
        ['cancelOrderByClientIdV2', 12],
        ['closeOpenOrders', 14],
        ['initOpenOrders', 15],
        ['prune', 16],
        ['consumeEventsPermissioned', 17],
    ] as const)('should return %i for %s', (key, expected) => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS[key], SERUM_PROGRAM_IDS_BY_NAME.openBook);
        expect(parseSerumInstructionCode(ix)).toBe(expected);
    });
});

describe('resolveSerumInstructionName', () => {
    it('should resolve the instruction name from a program id and discriminator', () => {
        expect(resolveSerumInstructionName(OPEN_BOOK_PROGRAM_ID, makeRawInstructionData(2))).toBe('Match Orders');
    });

    it('should resolve for deprecated serum program ids', () => {
        expect(
            resolveSerumInstructionName(SERUM_PROGRAM_IDS_BY_NAME.dexV3.toBase58(), makeRawInstructionData(10)),
        ).toBe('New Order v3');
    });

    it('should return undefined for an unrelated program id', () => {
        expect(
            resolveSerumInstructionName('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', makeRawInstructionData(2)),
        ).toBeUndefined();
    });

    it('should return undefined when the discriminator is shorter than 5 bytes', () => {
        expect(resolveSerumInstructionName(OPEN_BOOK_PROGRAM_ID, new Uint8Array([0, 2]))).toBeUndefined();
    });

    it('should return undefined for an unknown instruction code', () => {
        expect(resolveSerumInstructionName(OPEN_BOOK_PROGRAM_ID, makeRawInstructionData(255))).toBeUndefined();
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
        const ix = makeInstruction(makeRawInstructionData(code), SERUM_PROGRAM_IDS_BY_NAME.openBook);
        expect(parseSerumInstructionTitle(ix)).toBe(expected);
    });

    it('should throw on an unknown instruction code', () => {
        const ix = makeInstruction(makeRawInstructionData(255), SERUM_PROGRAM_IDS_BY_NAME.openBook);
        expect(() => parseSerumInstructionTitle(ix)).toThrow('Unrecognized Serum instruction code: 255');
    });

    it('should throw on data too short to hold an instruction code', () => {
        const ix = makeInstruction(Buffer.from([0, 2]), SERUM_PROGRAM_IDS_BY_NAME.openBook);
        expect(() => parseSerumInstructionTitle(ix)).toThrow('Serum instruction data too short (2 bytes)');
    });
});

describe('getSerumInstructionLabel', () => {
    it('should return the instruction name when resolvable', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.newOrderV3, SERUM_PROGRAM_IDS_BY_NAME.dexV3);
        expect(getSerumInstructionLabel(ix)).toBe('New Order v3');
    });

    it('should return "No data" for an empty instruction', () => {
        const ix = makeInstruction(Buffer.alloc(0), SERUM_PROGRAM_IDS_BY_NAME.dexV1);
        expect(getSerumInstructionLabel(ix)).toBe('No data');
    });

    it('should return "Unknown" for an unresolvable non-empty instruction', () => {
        const ix = makeInstruction(makeRawInstructionData(255), SERUM_PROGRAM_IDS_BY_NAME.dexV1);
        expect(getSerumInstructionLabel(ix)).toBe('Unknown');
    });
});
