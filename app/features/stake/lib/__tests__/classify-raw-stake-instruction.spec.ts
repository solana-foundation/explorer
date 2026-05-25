import { describe, expect, it } from 'vitest';

import { classifyRawStakeInstruction } from '../classify-raw-stake-instruction';

// Discriminators are little-endian u32; see @solana-program/stake/src/index.mjs.
const GET_MINIMUM_DELEGATION_DISCRIMINATOR = 13;
const INITIALIZE_DISCRIMINATOR = 0;
const UNKNOWN_DISCRIMINATOR = 255;

const discriminatorBytes = (value: number): Buffer => {
    const buf = Buffer.alloc(4);
    buf.writeUInt32LE(value, 0);
    return buf;
};

describe('classifyRawStakeInstruction', () => {
    it('should classify a GetMinimumDelegation discriminator as the dedicated card', () => {
        const result = classifyRawStakeInstruction(discriminatorBytes(GET_MINIMUM_DELEGATION_DISCRIMINATOR));
        expect(result).toEqual({ kind: 'getMinimumDelegation' });
    });

    it('should classify a parsed-path instruction as unsupported', () => {
        const result = classifyRawStakeInstruction(discriminatorBytes(INITIALIZE_DISCRIMINATOR));
        expect(result).toEqual({ kind: 'unsupported' });
    });

    it('should classify unrecognized data as invalid and surface the underlying error', () => {
        const result = classifyRawStakeInstruction(discriminatorBytes(UNKNOWN_DISCRIMINATOR));
        expect(result.kind).toBe('invalid');
        if (result.kind === 'invalid') {
            expect(result.error).toBeInstanceOf(Error);
        }
    });
});
