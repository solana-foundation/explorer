import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { isTokenSwapInstruction, parseTokenSwapInstructionTitle, resolveTokenSwapInstructionName } from '../detection';
import { TOKEN_SWAP_PROGRAM_IDS } from '../program-ids';

const MAINNET_PROGRAM_ID = 'SwaPpA9LAaLfeLi3a68M4DjnLqgtticKg6CnyNwgAC8';

function makeInstruction(data: number[], programId: string = MAINNET_PROGRAM_ID): TransactionInstruction {
    return new TransactionInstruction({ data: Buffer.from(data), keys: [], programId: new PublicKey(programId) });
}

describe('TOKEN_SWAP_PROGRAM_IDS', () => {
    it('should list the current deployment and every legacy deployment', () => {
        expect(TOKEN_SWAP_PROGRAM_IDS).toHaveLength(10);
        expect(TOKEN_SWAP_PROGRAM_IDS[0]).toBe(MAINNET_PROGRAM_ID);
    });
});

describe('isTokenSwapInstruction', () => {
    it.each(TOKEN_SWAP_PROGRAM_IDS.map(id => [id]))('should return true for %s', programId => {
        expect(isTokenSwapInstruction(makeInstruction([1], programId))).toBe(true);
    });

    it('should return false for System Program', () => {
        expect(isTokenSwapInstruction(makeInstruction([1], SystemProgram.programId.toBase58()))).toBe(false);
    });
});

describe('resolveTokenSwapInstructionName', () => {
    it.each([
        [0, 'Initialize Swap'],
        [1, 'Swap'],
        [2, 'Deposit All Token Types'],
        [3, 'Withdraw All Token Types'],
        [4, 'Deposit Single Token Type Exact Amount In'],
        [5, 'Withdraw Single Token Type Exact Amount Out'],
    ])('should name tag %i as %s', (tag, name) => {
        expect(resolveTokenSwapInstructionName(MAINNET_PROGRAM_ID, Uint8Array.of(tag))).toBe(name);
    });

    it('should return undefined for an unknown tag', () => {
        expect(resolveTokenSwapInstructionName(MAINNET_PROGRAM_ID, Uint8Array.of(6))).toBeUndefined();
    });

    it('should return undefined for empty data', () => {
        expect(resolveTokenSwapInstructionName(MAINNET_PROGRAM_ID, new Uint8Array())).toBeUndefined();
    });

    it('should return undefined for another program', () => {
        expect(resolveTokenSwapInstructionName(SystemProgram.programId.toBase58(), Uint8Array.of(1))).toBeUndefined();
    });
});

describe('parseTokenSwapInstructionTitle', () => {
    it('should return the instruction name', () => {
        expect(parseTokenSwapInstructionTitle(makeInstruction([1, 0xff]))).toBe('Swap');
    });

    it('should throw on an unknown tag', () => {
        expect(() => parseTokenSwapInstructionTitle(makeInstruction([6]))).toThrow(
            'Unrecognized Token Swap instruction code: 6',
        );
    });

    it('should throw on empty data', () => {
        expect(() => parseTokenSwapInstructionTitle(makeInstruction([]))).toThrow('Token Swap instruction has no data');
    });
});
