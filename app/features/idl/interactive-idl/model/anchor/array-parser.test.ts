import { describe, expect, it } from 'vitest';

import { parseArrayInput } from './array-parser';

describe('parseArrayInput', () => {
    it('should return array as-is when input is already an array', () => {
        expect(parseArrayInput(['item1', 'item2'])).toEqual(['item1', 'item2']);
        expect(parseArrayInput([1, 2, 3])).toEqual([1, 2, 3]);
        expect(parseArrayInput([])).toEqual([]);
    });

    it('should parse valid JSON arrays', () => {
        expect(parseArrayInput('["item1", "item2"]')).toEqual(['item1', 'item2']);
        expect(parseArrayInput('[1, 2, 3]')).toEqual([1, 2, 3]);
        expect(parseArrayInput('[true, false, null]')).toEqual([true, false, null]);
        expect(parseArrayInput('["mixed", 123, true]')).toEqual(['mixed', 123, true]);
    });

    it('should throw error for invalid JSON when string starts with bracket', () => {
        expect(() => parseArrayInput('[item1, item2]')).toThrow('Invalid JSON array');
        expect(() => parseArrayInput('[1, 2, 3')).toThrow('Invalid JSON array');
    });

    it('should parse comma-separated values as strings', () => {
        expect(parseArrayInput('item1,item2')).toEqual(['item1', 'item2']);
        expect(parseArrayInput('item1, item2')).toEqual(['item1', 'item2']);
        expect(parseArrayInput('item1 , item2 , item3')).toEqual(['item1', 'item2', 'item3']);
    });

    it('should keep quotes in comma-separated values as-is', () => {
        expect(parseArrayInput('"item1", "item2"')).toEqual(['"item1"', '"item2"']);
        expect(parseArrayInput("'item1', 'item2'")).toEqual(["'item1'", "'item2'"]);
    });

    it('should keep numbers as strings in comma-separated lists', () => {
        expect(parseArrayInput('1,2,3')).toEqual(['1', '2', '3']);
        expect(parseArrayInput('1.5, 2.7, 3.9')).toEqual(['1.5', '2.7', '3.9']);
    });

    it('should keep booleans and null as strings in comma-separated lists', () => {
        expect(parseArrayInput('true,false')).toEqual(['true', 'false']);
        expect(parseArrayInput('true, false, null')).toEqual(['true', 'false', 'null']);
    });

    it('should handle single values by wrapping them in array', () => {
        expect(parseArrayInput('item')).toEqual(['item']);
        expect(parseArrayInput('123')).toEqual(['123']);
        expect(parseArrayInput('true')).toEqual(['true']);
        expect(parseArrayInput(123)).toEqual([123]);
        expect(parseArrayInput(true)).toEqual([true]);
    });

    it('should handle empty inputs', () => {
        expect(parseArrayInput('')).toEqual([]);
    });

    it('should handle whitespace correctly', () => {
        expect(parseArrayInput('  item1  ,  item2  ')).toEqual(['item1', 'item2']);
        expect(parseArrayInput('  ')).toEqual([]);
    });

    it('should preserve large numeric strings (public keys)', () => {
        const pubkey1 = '11111111111111111111111111111111';
        const pubkey2 = '22222222222222222222222222222222';

        expect(parseArrayInput(`${pubkey1},${pubkey2}`)).toEqual([pubkey1, pubkey2]);
        expect(parseArrayInput(`["${pubkey1}", "${pubkey2}"]`)).toEqual([pubkey1, pubkey2]);
    });

    it('should wrap non-string, non-array values in array', () => {
        expect(parseArrayInput(null)).toEqual([null]);
        expect(parseArrayInput(undefined)).toEqual([undefined]);
        expect(parseArrayInput({ key: 'value' })).toEqual([{ key: 'value' }]);
    });
});
