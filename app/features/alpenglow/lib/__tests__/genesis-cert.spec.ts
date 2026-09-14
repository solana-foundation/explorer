import { getBase58Encoder } from '@solana/kit';
import { describe, expect, it } from 'vitest';

import { parseGenesisCert } from '../genesis-cert';

const BLOCK_ID = 'HnvmbDUEbrmuj3mYAA1EKGGzpZRuFRgMRPwtsgGFadmn';
const BLOCK_ID_BYTES = [...getBase58Encoder().encode(BLOCK_ID)];
const OK = BLOCK_ID_BYTES;

function certPayload(overrides: { block?: unknown; signature?: unknown } = {}) {
    return {
        block: { blockId: BLOCK_ID_BYTES, slot: 460_012_345n },
        signature: { bitmap: [255, 3], signature: [1, 2, 3] },
        ...overrides,
    };
}

describe('parseGenesisCert', () => {
    it('should read the certified block back as a base58 id and a bigint slot', () => {
        expect(parseGenesisCert(certPayload())).toEqual({ blockId: BLOCK_ID, slot: 460_012_345n });
    });

    it('should accept a certificate carrying fields it does not read', () => {
        const payload = { ...certPayload(), somethingAddedLater: { nested: true } };

        expect(parseGenesisCert(payload).slot).toBe(460_012_345n);
    });

    it('should reject a block id that is not 32 bytes', () => {
        expect(() => parseGenesisCert(certPayload({ block: { blockId: [1, 2, 3], slot: 1n } }))).toThrow();
    });

    it('should reject a block id byte outside 0..255', () => {
        const blockId = [...BLOCK_ID_BYTES.slice(0, 31), 256];

        expect(() => parseGenesisCert(certPayload({ block: { blockId, slot: 1n } }))).toThrow();
    });

    // kit upcasts every integer it reads, so a slot still carrying a number is one it would not
    // touch — and a number is exactly what the card must not print as a slot.
    it.each([
        ['negative', -1n],
        ['fractional', 1.5],
        ['a plain integer kit would have upcast', 460_012_345],
        ['a string', '460012345'],
    ])('should reject a slot that is %s', (_label, slot) => {
        expect(() => parseGenesisCert(certPayload({ block: { blockId: BLOCK_ID_BYTES, slot } }))).toThrow();
    });

    // A block id that is the wrong kind of thing, not merely the wrong length. The card reads a
    // base58 string straight out of this, and every one of these would decode to something.
    it.each([
        ['a base58 string', { block: { blockId: 'Hnvmb...', slot: 1n } }],
        ['an index object', { block: { blockId: { 0: 1, 1: 2 }, slot: 1n } }],
        ['a null byte entry', { block: { blockId: [...OK.slice(0, 31), null], slot: 1n } }],
        ['33 bytes', { block: { blockId: [...OK, 0], slot: 1n } }],
    ])('should refuse a block id that is %s', (_label, payload) => {
        expect(() => parseGenesisCert(payload)).toThrow();
    });

    it.each([
        ['missing', { block: { blockId: OK } }],
        ['null', { block: { blockId: OK, slot: null } }],
    ])('should refuse a slot that is %s', (_label, payload) => {
        expect(() => parseGenesisCert(payload)).toThrow();
    });
});
