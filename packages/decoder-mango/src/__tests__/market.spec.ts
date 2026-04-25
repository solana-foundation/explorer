import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { getPerpMarketFromInstruction, getSpotMarketFromInstruction, spotMarketFromIndex } from '../market';
import { ENCODED_INSTRUCTIONS, makeInstruction, MANGO_PROGRAM_IDS, PERP_MARKETS, SPOT_MARKETS } from './fixtures';

describe('getSpotMarketFromInstruction', () => {
    it('should return spot market config for known market pubkey', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.Deposit, MANGO_PROGRAM_IDS.mainnet);
        const spotMarketMeta = {
            isSigner: false,
            isWritable: false,
            pubkey: SPOT_MARKETS['MNGO/USDC'].publicKey,
        };

        const result = getSpotMarketFromInstruction(ix, spotMarketMeta);

        expect(result).toBeDefined();
        expect(result!.name).toBe('MNGO/USDC');
        expect(result!.publicKey.equals(SPOT_MARKETS['MNGO/USDC'].publicKey)).toBe(true);
    });

    it('should return undefined for unknown spot market pubkey', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.Deposit, MANGO_PROGRAM_IDS.mainnet);
        const unknownMarket = {
            isSigner: false,
            isWritable: false,
            pubkey: PublicKey.default,
        };

        const result = getSpotMarketFromInstruction(ix, unknownMarket);
        expect(result).toBeUndefined();
    });

    it('should return undefined for non-mango program ID', () => {
        const ix = new TransactionInstruction({
            data: Buffer.alloc(12),
            keys: [],
            programId: SystemProgram.programId,
        });
        const spotMarketMeta = {
            isSigner: false,
            isWritable: false,
            pubkey: SPOT_MARKETS['MNGO/USDC'].publicKey,
        };

        const result = getSpotMarketFromInstruction(ix, spotMarketMeta);
        expect(result).toBeUndefined();
    });
});

describe('getPerpMarketFromInstruction', () => {
    it('should return perp market config for known market pubkey', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.Deposit, MANGO_PROGRAM_IDS.mainnet);
        const perpMarketMeta = {
            isSigner: false,
            isWritable: false,
            pubkey: PERP_MARKETS['BTC-PERP'].publicKey,
        };

        const result = getPerpMarketFromInstruction(ix, perpMarketMeta);

        expect(result).toBeDefined();
        expect(result!.name).toBe('BTC-PERP');
        expect(result!.publicKey.equals(PERP_MARKETS['BTC-PERP'].publicKey)).toBe(true);
    });

    it('should return undefined for unknown perp market pubkey', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.Deposit, MANGO_PROGRAM_IDS.mainnet);
        const unknownMarket = {
            isSigner: false,
            isWritable: false,
            pubkey: PublicKey.default,
        };

        const result = getPerpMarketFromInstruction(ix, unknownMarket);
        expect(result).toBeUndefined();
    });
});

describe('spotMarketFromIndex', () => {
    it.each([
        [0, 'MNGO/USDC'],
        [1, 'BTC/USDC'],
    ] as const)('should return %s market name for index %i', (index, expectedName) => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.Deposit, MANGO_PROGRAM_IDS.mainnet);
        expect(spotMarketFromIndex(ix, index)).toBe(expectedName);
    });

    it('should return UNKNOWN for non-existent market index', () => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.Deposit, MANGO_PROGRAM_IDS.mainnet);
        const result = spotMarketFromIndex(ix, 999);
        expect(result).toBe('UNKNOWN');
    });

    it('should return undefined for non-mango program ID', () => {
        const ix = new TransactionInstruction({
            data: Buffer.alloc(12),
            keys: [],
            programId: SystemProgram.programId,
        });
        const result = spotMarketFromIndex(ix, 0);
        expect(result).toBeUndefined();
    });
});
