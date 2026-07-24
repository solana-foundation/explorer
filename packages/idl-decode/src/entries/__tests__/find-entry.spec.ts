// Pure lookups over DecodedEntry[] — codama's builders are fine here (runtime spec, no literal-type stakes).
import {
    enumEmptyVariantTypeNode,
    enumStructVariantTypeNode,
    enumTypeNode,
    numberTypeNode,
    publicKeyTypeNode,
    structTypeNode,
} from 'codama';
import { describe, expect, expectTypeOf, it } from 'vitest';

import { type DecodedEntry, findEntry, findEntryOfKind, getEnumVariantName, joinPath } from '../index';

const entries: DecodedEntry[] = [
    { node: numberTypeNode('u8'), path: ['discriminator'], value: 3 },
    { node: numberTypeNode('u64'), path: ['amount'], value: 42n },
    { node: publicKeyTypeNode(), path: ['signers', 0], value: 'addr1' },
    { node: numberTypeNode('u16'), path: ['chainId', 'id'], value: 1 },
];

describe('joinPath', () => {
    it('should join segments into the dot-form key, numeric indices included', () => {
        expect(joinPath(['chainId', 'id'])).toBe('chainId.id');
        expect(joinPath(['signers', 0])).toBe('signers.0');
    });

    it('should pass a dot-form key through unchanged', () => {
        expect(joinPath('chainId.id')).toBe('chainId.id');
    });

    it('should take the entry itself — maps point-free', () => {
        expect(entries.map(joinPath)).toEqual(['discriminator', 'amount', 'signers.0', 'chainId.id']);
    });
});

describe('findEntry', () => {
    it('should focus a leaf by its dot path', () => {
        expect(findEntry(entries, 'chainId.id')?.value).toBe(1);
    });

    it('should focus a leaf by segments, numeric indices included', () => {
        expect(findEntry(entries, ['signers', 0])?.value).toBe('addr1');
    });

    it('should treat the dot form and segments as the same key', () => {
        expect(findEntry(entries, 'signers.0')).toBe(findEntry(entries, ['signers', 0]));
    });

    it('should return undefined for a missing path', () => {
        expect(findEntry(entries, 'amount.nested')).toBeUndefined();
        expect(findEntry(entries, 'missing')).toBeUndefined();
    });
});

describe('findEntryOfKind', () => {
    it('should narrow the node so kind-specific fields read typed', () => {
        const amount = findEntryOfKind(entries, 'amount', 'numberTypeNode');
        expect(amount?.node.format).toBe('u64');
        expect(amount?.value).toBe(42n);
        expectTypeOf(amount?.node.kind).toEqualTypeOf<'numberTypeNode' | undefined>();
    });

    it('should return undefined when the kind disagrees', () => {
        expect(findEntryOfKind(entries, 'amount', 'publicKeyTypeNode')).toBeUndefined();
    });

    it('should return undefined for a missing path', () => {
        expect(findEntryOfKind(entries, 'missing', 'numberTypeNode')).toBeUndefined();
    });
});

describe('getEnumVariantName', () => {
    const modeEnum = enumTypeNode([enumEmptyVariantTypeNode('locking'), enumEmptyVariantTypeNode('burning')]);

    it("should name a scalar enum's decoded index with the IDL's own spelling", () => {
        expect(getEnumVariantName({ node: modeEnum, path: ['mode'], value: 1 })).toBe('burning');
    });

    it("should pass a data enum's own __kind through", () => {
        const dataEnum = enumTypeNode([enumStructVariantTypeNode('shaped', structTypeNode([]))]);
        expect(getEnumVariantName({ node: dataEnum, path: ['event'], value: { __kind: 'Shaped' } })).toBe('Shaped');
    });

    it('should return undefined for an out-of-range index — the disagreement stays visible', () => {
        expect(getEnumVariantName({ node: modeEnum, path: ['mode'], value: 9 })).toBeUndefined();
    });

    it('should return undefined off the enum kind and compose with a findEntry miss', () => {
        expect(getEnumVariantName(findEntry(entries, 'amount'))).toBeUndefined();
        expect(getEnumVariantName(findEntry(entries, 'missing'))).toBeUndefined();
    });
});
