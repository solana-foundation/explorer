import { PublicKey } from '@solana/web3.js';
import { create } from 'superstruct';
import { describe, expect, it } from 'vitest';

import { PublicKeyFromString } from '../pubkey.js';

const ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

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
