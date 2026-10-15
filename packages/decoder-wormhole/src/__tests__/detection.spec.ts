import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { isWormholeInstruction, parseWormholeInstructionTitle, resolveWormholeInstructionName } from '../detection';
import { WORMHOLE_PROGRAM_IDS } from '../program-ids';

const MAINNET_PROGRAM_ID = 'WormT3McKhFJ2RkiGpdw9GKvNCrB2aB54gb2uV9MfQC';

function makeInstruction(data: number[], programId: string = MAINNET_PROGRAM_ID): TransactionInstruction {
    return new TransactionInstruction({ data: Buffer.from(data), keys: [], programId: new PublicKey(programId) });
}

describe('WORMHOLE_PROGRAM_IDS', () => {
    it('should list the single deployment shared by mainnet, testnet and devnet', () => {
        expect(WORMHOLE_PROGRAM_IDS).toEqual([MAINNET_PROGRAM_ID]);
    });
});

describe('isWormholeInstruction', () => {
    it('should return true for the Wormhole program', () => {
        expect(isWormholeInstruction(makeInstruction([1]))).toBe(true);
    });

    it('should return false for System Program', () => {
        expect(isWormholeInstruction(makeInstruction([1], SystemProgram.programId.toBase58()))).toBe(false);
    });
});

describe('resolveWormholeInstructionName', () => {
    it.each([
        [0, 'Initialize Bridge'],
        [1, 'Transfer Assets Out'],
        [2, 'Post VAA'],
        [3, 'Evict Transfer Proposal'],
        [4, 'Evict Claimed VAA'],
        [5, 'Poke Proposal'],
        [6, 'Verify Signatures'],
        [7, 'Create Wrapped Asset'],
    ])('should name tag %i as %s', (tag, name) => {
        expect(resolveWormholeInstructionName(MAINNET_PROGRAM_ID, Uint8Array.of(tag))).toBe(name);
    });

    it('should return undefined for an unknown tag', () => {
        expect(resolveWormholeInstructionName(MAINNET_PROGRAM_ID, Uint8Array.of(8))).toBeUndefined();
    });

    it('should return undefined for empty data', () => {
        expect(resolveWormholeInstructionName(MAINNET_PROGRAM_ID, new Uint8Array())).toBeUndefined();
    });

    it('should return undefined for another program', () => {
        expect(resolveWormholeInstructionName(SystemProgram.programId.toBase58(), Uint8Array.of(1))).toBeUndefined();
    });
});

describe('parseWormholeInstructionTitle', () => {
    it('should return the instruction name', () => {
        expect(parseWormholeInstructionTitle(makeInstruction([2, 0xff]))).toBe('Post VAA');
    });

    it('should throw on an unknown tag', () => {
        expect(() => parseWormholeInstructionTitle(makeInstruction([8]))).toThrow(
            'Unrecognized Wormhole instruction code: 8',
        );
    });

    it('should throw on empty data', () => {
        expect(() => parseWormholeInstructionTitle(makeInstruction([]))).toThrow('Wormhole instruction has no data');
    });
});
