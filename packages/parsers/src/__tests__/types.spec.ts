import { PublicKey } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { isParsedInstruction } from '../types.js';

const PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

describe('isParsedInstruction', () => {
    it('should reject undefined dispatch results', () => {
        expect(isParsedInstruction(undefined)).toBe(false);
    });

    it('should reject UnparsedInstruction results', () => {
        expect(
            isParsedInstruction({
                programId: PROGRAM_ID,
                programLabel: 'spl-token',
                unknown: true,
            }),
        ).toBe(false);
    });

    it('should accept canonical ParsedInstruction results', () => {
        expect(
            isParsedInstruction({
                parsed: { info: {}, type: 'transfer' },
                program: 'spl-token',
                programId: PROGRAM_ID,
            }),
        ).toBe(true);
    });
});
