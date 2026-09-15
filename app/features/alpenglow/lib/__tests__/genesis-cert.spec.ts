import { getBase58Encoder } from '@solana/kit';
import { describe, expect, it } from 'vitest';

import { parseGenesisCert } from '../genesis-cert';

const BLOCK_ID = 'HnvmbDUEbrmuj3mYAA1EKGGzpZRuFRgMRPwtsgGFadmn';
const BLOCK_ID_BYTES = [...getBase58Encoder().encode(BLOCK_ID)];
const OK = BLOCK_ID_BYTES;

function certPayload(overrides: { block?: unknown; signature?: unknown } = {}) {
    return {
        block: { blockId: BLOCK_ID_BYTES, slot: 460_012_345 },
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
        expect(() => parseGenesisCert(certPayload({ block: { blockId: [1, 2, 3], slot: 1 } }))).toThrow();
    });

    it('should reject a block id byte outside 0..255', () => {
        const blockId = [...BLOCK_ID_BYTES.slice(0, 31), 256];

        expect(() => parseGenesisCert(certPayload({ block: { blockId, slot: 1 } }))).toThrow();
    });

    it.each([
        ['fractional', 1.5],
        ['negative', -1],
        ['a string', '460012345'],
    ])('should reject a slot that is %s', (_label, slot) => {
        expect(() => parseGenesisCert(certPayload({ block: { blockId: BLOCK_ID_BYTES, slot } }))).toThrow();
    });

    it('should reject a payload with no block at all', () => {
        expect(() => parseGenesisCert({ signature: { bitmap: [], signature: [] } })).toThrow();
    });

    // Everything a node could put here that is not a certificate. The card reads a slot and a
    // block id straight out of this, so nothing partial may survive the door.

    it.each([
        ['blockId missing', { block: { slot: 1 } }],
        ['blockId as a base58 string', { block: { blockId: 'Hnvmb...', slot: 1 } }],
        ['blockId as an index object', { block: { blockId: { 0: 1, 1: 2 }, slot: 1 } }],
        ['blockId with a null byte entry', { block: { blockId: [...OK.slice(0, 31), null], slot: 1 } }],
        ['blockId 33 bytes', { block: { blockId: [...OK, 0], slot: 1 } }],
        ['slot missing', { block: { blockId: OK } }],
        ['slot as null', { block: { blockId: OK, slot: null } }],
        ['block as null', { block: null }],
        ['block as an array', { block: [] }],
        ['the whole payload null', null],
        ['the whole payload a string', 'nope'],
    ])('should refuse a certificate with %s', (_label, payload) => {
        expect(() => parseGenesisCert(payload)).toThrow();
    });

    it('should not let a __proto__ key reach Object.prototype', () => {
        const payload = JSON.parse(
            `{"block":{"blockId":${JSON.stringify(OK)},"slot":1},"__proto__":{"polluted":true}}`,
        );
        parseGenesisCert(payload);
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });
});
