import { describe, expect, it } from 'vitest';

import { isLeafTupleU8String, parseAnchorType_U8_PathTuple } from './leaf-tuple-type-handler';

describe('parseAnchorType_U8_PathTuple', () => {
    it('parses the canonical form', () => {
        const res = parseAnchorType_U8_PathTuple('(u8,[u8;32])');
        expect(res).toEqual({ tuple: ['u8', { array: ['u8', 32] }] });
    });

    it('tolerates whitespace', () => {
        const res = parseAnchorType_U8_PathTuple('(  u8 ,  [ u8 ; 32 ]  )');
        expect(res).toEqual({ tuple: ['u8', { array: ['u8', 32] }] });
    });

    // tuple wrapper / arity
    it('rejects missing closing paren', () => {
        expect(() => parseAnchorType_U8_PathTuple('(u8,[u8;32]')).toThrow(/Expected tuple like/i);
    });

    it('rejects extra tuple items', () => {
        expect(() => parseAnchorType_U8_PathTuple('(u8,[u8;32],u8)')).toThrow(
            /Too many tuple items|Expected exactly two tuple items|Expected array like/i
        );
    });

    // left item must be u8
    it('rejects non-u8 first item', () => {
        expect(() => parseAnchorType_U8_PathTuple('(u16,[u8;32])')).toThrow(/First tuple item must be "u8"/i);
    });

    // right item must be [u8;N]
    it('rejects non-array right item', () => {
        expect(() => parseAnchorType_U8_PathTuple('(u8,u8)')).toThrow(/Expected array like/i);
    });

    it('rejects missing separator in array', () => {
        expect(() => parseAnchorType_U8_PathTuple('(u8,[u8 32])')).toThrow(/Missing ';' or ',' in array body/i);
    });

    it('parses comma separator in array', () => {
        const res = parseAnchorType_U8_PathTuple('(u8,[u8,32])');
        expect(res).toEqual({ tuple: ['u8', { array: ['u8', 32] }] });
    });

    it('rejects non-u8 element type in array', () => {
        expect(() => parseAnchorType_U8_PathTuple('(u8,[u16;32])')).toThrow(/Only "u8" element supported/i);
    });

    it('rejects non-integer length', () => {
        expect(() => parseAnchorType_U8_PathTuple('(u8,[u8;3.2])')).toThrow(/non-negative integer/i);
    });

    it('rejects negative length', () => {
        expect(() => parseAnchorType_U8_PathTuple('(u8,[u8;-1])')).toThrow(/non-negative integer/i);
    });

    it('handles length = 0', () => {
        const res = parseAnchorType_U8_PathTuple('(u8,[u8;0])');
        expect(res).toEqual({ tuple: ['u8', { array: ['u8', 0] }] });
    });

    it('handles bigger lengths', () => {
        const res = parseAnchorType_U8_PathTuple('(u8,[u8;255])');
        expect(res).toEqual({ tuple: ['u8', { array: ['u8', 255] }] });
    });
});

describe('isLeafTupleU8String', () => {
    it('accepts canonical form', () => {
        expect(isLeafTupleU8String('(u8,[u8;32])')).toBe(true);
    });

    it('accepts whitespace variants', () => {
        expect(isLeafTupleU8String('(  u8 ,  [ u8 ; 0 ]  )')).toBe(true);
    });

    it('accepts larger lengths', () => {
        expect(isLeafTupleU8String('(u8,[u8;255])')).toBe(true);
    });

    it('rejects missing parens early', () => {
        expect(isLeafTupleU8String('u8,[u8;32]')).toBe(false);
    });

    it('rejects tuples with wrong arity', () => {
        expect(isLeafTupleU8String('(u8,[u8;32],u8)')).toBe(false);
    });

    it('rejects when right side not bracketed array', () => {
        expect(isLeafTupleU8String('(u8,u8)')).toBe(false);
    });

    it('rejects when array body lacks separator', () => {
        expect(isLeafTupleU8String('(u8,[u8 32])')).toBe(false);
    });

    it('accepts comma separator in array', () => {
        expect(isLeafTupleU8String('(u8,[u8,32])')).toBe(true);
    });

    it('rejects non-u8 left item', () => {
        expect(isLeafTupleU8String('(u16,[u8;32])')).toBe(false);
    });

    it('rejects non-u8 element in array', () => {
        expect(isLeafTupleU8String('(u8,[u16;32])')).toBe(false);
    });

    it('rejects negative length', () => {
        expect(isLeafTupleU8String('(u8,[u8;-1])')).toBe(false);
    });

    it('rejects non-integer length', () => {
        expect(isLeafTupleU8String('(u8,[u8;3.14])')).toBe(false);
    });

    it('rejects empty length', () => {
        expect(isLeafTupleU8String('(u8,[u8;])')).toBe(false);
    });

    it('rejects non-string inputs', () => {
        expect(isLeafTupleU8String(null as any)).toBe(false);
        expect(isLeafTupleU8String(undefined as any)).toBe(false);
        expect(isLeafTupleU8String(42 as any)).toBe(false);
        expect(isLeafTupleU8String({} as any)).toBe(false);
    });
});
