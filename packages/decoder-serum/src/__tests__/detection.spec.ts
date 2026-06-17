import { MARKETS } from '@project-serum/serum';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { OPEN_BOOK_PROGRAM_ID } from '../config';
import {
    isDeprecatedSerumProgram,
    isSerumInstruction,
    parseSerumInstructionCode,
    parseSerumInstructionKey,
    parseSerumInstructionTitle,
} from '../detection';
import { ENCODED_INSTRUCTIONS, makeInstruction, makeRawInstructionData, SERUM_PROGRAM_IDS_BY_NAME } from './fixtures';

describe('isSerumInstruction', () => {
    it.each([
        ['legacyV1', SERUM_PROGRAM_IDS_BY_NAME.legacyV1],
        ['legacyV2', SERUM_PROGRAM_IDS_BY_NAME.legacyV2],
        ['openBook', SERUM_PROGRAM_IDS_BY_NAME.openBook],
    ] as const)('returns true for the %s program id', (_name, programId) => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.matchOrders, programId);
        expect(isSerumInstruction(ix)).toBe(true);
    });

    it('returns true for any program id present in MARKETS', () => {
        const marketProgramId = MARKETS.map(m => m.programId).find(Boolean);
        if (!marketProgramId) {
            throw new Error('MARKETS list unexpectedly contains no programIds');
        }
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.matchOrders, marketProgramId);
        expect(isSerumInstruction(ix)).toBe(true);
    });

    it('returns false for the System Program', () => {
        const ix = new TransactionInstruction({
            data: Buffer.alloc(5),
            keys: [],
            programId: SystemProgram.programId,
        });
        expect(isSerumInstruction(ix)).toBe(false);
    });

    it('returns false for an unrelated SPL program id', () => {
        const ix = makeInstruction(
            ENCODED_INSTRUCTIONS.matchOrders,
            new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        );
        expect(isSerumInstruction(ix)).toBe(false);
    });
});

describe('isDeprecatedSerumProgram', () => {
    it.each([
        ['legacyV1', SERUM_PROGRAM_IDS_BY_NAME.legacyV1],
        ['legacyV2', SERUM_PROGRAM_IDS_BY_NAME.legacyV2],
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
    ] as const)('returns %i for %s', (key, expected) => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS[key], SERUM_PROGRAM_IDS_BY_NAME.openBook);
        expect(parseSerumInstructionCode(ix)).toBe(expected);
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
    ] as const)('maps code %i to "%s"', (code, expected) => {
        const ix = makeInstruction(makeRawInstructionData(code), SERUM_PROGRAM_IDS_BY_NAME.openBook);
        expect(parseSerumInstructionTitle(ix)).toBe(expected);
    });

    it('throws on an unknown instruction code', () => {
        const ix = makeInstruction(makeRawInstructionData(255), SERUM_PROGRAM_IDS_BY_NAME.openBook);
        expect(() => parseSerumInstructionTitle(ix)).toThrow('Unrecognized Serum instruction code: 255');
    });
});

describe('parseSerumInstructionKey', () => {
    it.each([
        ['initializeMarket'],
        ['newOrder'],
        ['matchOrders'],
        ['consumeEvents'],
        ['cancelOrder'],
        ['settleFunds'],
        ['cancelOrderByClientId'],
        ['newOrderV3'],
        ['cancelOrderV2'],
        ['cancelOrderByClientIdV2'],
        ['closeOpenOrders'],
        ['initOpenOrders'],
        ['prune'],
        ['consumeEventsPermissioned'],
    ] as const)('returns %s for an encoded %s instruction', key => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS[key], SERUM_PROGRAM_IDS_BY_NAME.openBook);
        expect(parseSerumInstructionKey(ix)).toBe(key);
    });
});
