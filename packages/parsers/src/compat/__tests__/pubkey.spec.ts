import { PublicKey } from '@solana/web3.js';
import { create } from 'superstruct';
import { describe, expect, it } from 'vitest';

import { gen } from '../../__tests__/gen.js';
import { PublicKeyFromString } from '../pubkey.js';

const ADDRESS = gen.tokenProgram;

describe('PublicKeyFromString', () => {
    it('should coerce a base58 string into a PublicKey instance', () => {
        expect(create(ADDRESS, PublicKeyFromString)).toEqual(new PublicKey(ADDRESS));
    });

    it('should pass existing PublicKey instances through', () => {
        const key = new PublicKey(ADDRESS);

        expect(create(key, PublicKeyFromString)).toBe(key);
    });

    it('should reject non-string input', () => {
        expect(() => create(42, PublicKeyFromString)).toThrow();
    });
});
