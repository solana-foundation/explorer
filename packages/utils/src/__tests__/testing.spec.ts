import { getBase58Encoder } from '@solana/kit';
import { describe, expect, it } from 'vitest';

import { addressFromSeed, blockhashFromSeed, signatureFromSeed } from '../testing/index.js';

const BASE58_ENCODER = getBase58Encoder();

describe('addressFromSeed', () => {
    it('should return the same address for the same seed', () => {
        expect(addressFromSeed(7)).toBe(addressFromSeed(7));
    });

    it('should return a 32-byte address', () => {
        expect(BASE58_ENCODER.encode(addressFromSeed(7))).toHaveLength(32);
    });

    it('should return different addresses for seeds 256 apart', () => {
        expect(addressFromSeed(1)).not.toBe(addressFromSeed(257));
    });
});

describe('signatureFromSeed', () => {
    it('should return the same signature for the same seed', () => {
        expect(signatureFromSeed(7)).toBe(signatureFromSeed(7));
    });

    it('should return a 64-byte signature', () => {
        expect(BASE58_ENCODER.encode(signatureFromSeed(7))).toHaveLength(64);
    });

    it('should return different signatures for different seeds', () => {
        expect(signatureFromSeed(1)).not.toBe(signatureFromSeed(2));
    });
});

describe('blockhashFromSeed', () => {
    it('should return the same blockhash for the same seed', () => {
        expect(blockhashFromSeed(7)).toBe(blockhashFromSeed(7));
    });

    it('should return a 32-byte blockhash', () => {
        expect(BASE58_ENCODER.encode(blockhashFromSeed(7))).toHaveLength(32);
    });

    it('should return different blockhashes for different seeds', () => {
        expect(blockhashFromSeed(1)).not.toBe(blockhashFromSeed(2));
    });
});
