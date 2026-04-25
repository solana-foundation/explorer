import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { isMangoInstruction, parseMangoInstructionTitle } from '../detection';
import { ENCODED_INSTRUCTIONS, makeInstruction, MANGO_PROGRAM_IDS } from './fixtures';

describe('isMangoInstruction', () => {
    it.each([
        ['mainnet', MANGO_PROGRAM_IDS.mainnet],
        ['devnet', MANGO_PROGRAM_IDS.devnet],
        ['testnet', MANGO_PROGRAM_IDS.testnet],
    ] as const)('should return true for %s mango program ID', (_network, programId) => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS.Deposit, programId);
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
            ENCODED_INSTRUCTIONS.Deposit,
            new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        );
        expect(isMangoInstruction(ix)).toBe(false);
    });
});

describe('parseMangoInstructionTitle', () => {
    it.each([
        'Deposit',
        'Withdraw',
        'AddToBasket',
        'PlaceSpotOrder',
        'CancelSpotOrder',
        'PlacePerpOrder',
        'PlacePerpOrder2',
        'CancelPerpOrder',
        'AddSpotMarket',
        'AddPerpMarket',
        'ChangePerpMarketParams',
    ] as const)('should parse %s instruction', title => {
        const ix = makeInstruction(ENCODED_INSTRUCTIONS[title], MANGO_PROGRAM_IDS.mainnet);
        expect(parseMangoInstructionTitle(ix)).toBe(title);
    });
});
