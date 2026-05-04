import type { RootNode, TypeNode } from 'codama';
import { describe, expect, it } from 'vitest';

import { convertValue, getUserFacingArguments } from './convert-value';

describe('convertValue', () => {
    describe('nullish / empty values', () => {
        it('should return null for undefined', () => {
            expect(convertValue(undefined, stringType())).toBeNull();
        });

        it('should return null for null', () => {
            expect(convertValue(null, stringType())).toBeNull();
        });

        it('should return null for empty string', () => {
            expect(convertValue('', numberType('u8'))).toBeNull();
        });
    });

    describe('numberTypeNode', () => {
        it.each([
            ['u8', '42', 42],
            ['u16', '1000', 1000],
            ['u32', '123456', 123456],
            ['i8', '-5', -5],
            ['i16', '-1000', -1000],
            ['i32', '-123456', -123456],
            ['f32', '3.14', 3.14],
            ['f64', '2.718281828', 2.718281828],
        ])('should convert %s string to Number', (format, input, expected) => {
            expect(convertValue(input, numberType(format))).toBe(expected);
        });

        it.each([
            ['u64', '9999999999999'],
            ['u128', '340282366920938463463374607431768211455'],
            ['i64', '-9999999999999'],
            ['i128', '170141183460469231731687303715884105727'],
        ])('should convert %s string to BigInt', (format, input) => {
            expect(convertValue(input, numberType(format))).toBe(BigInt(input));
        });

        it('should convert non-string number value', () => {
            expect(convertValue(42, numberType('u8'))).toBe(42);
        });

        it('should throw for invalid number string', () => {
            expect(() => convertValue('abc', numberType('u32'))).toThrow('Invalid number value');
        });

        it('should throw for invalid BigInt string', () => {
            expect(() => convertValue('not-a-number', numberType('u64'))).toThrow('Invalid integer value');
        });
    });

    describe('booleanTypeNode', () => {
        it('should convert "true" to true', () => {
            expect(convertValue('true', booleanType())).toBe(true);
        });

        it('should convert "false" to false', () => {
            expect(convertValue('false', booleanType())).toBe(false);
        });

        it('should convert boolean true to true', () => {
            expect(convertValue(true, booleanType())).toBe(true);
        });

        it('should convert boolean false to false', () => {
            expect(convertValue(false, booleanType())).toBe(false);
        });

        it('should convert arbitrary string to false', () => {
            expect(convertValue('yes', booleanType())).toBe(false);
        });
    });

    describe('publicKeyTypeNode', () => {
        it('should return the string as-is', () => {
            const key = 'Htp9MGP8Tig923ZFY7Qf2zzbMUmYneFRAhSp7vSg4wxV';
            expect(convertValue(key, publicKeyType())).toBe(key);
        });
    });

    describe('stringTypeNode', () => {
        it('should return the string as-is', () => {
            expect(convertValue('hello', stringType())).toBe('hello');
        });

        it('should convert non-string to string', () => {
            expect(convertValue(123, stringType())).toBe('123');
        });
    });

    describe('bytesTypeNode', () => {
        it('should convert hex string to Uint8Array', () => {
            const result = convertValue('deadbeef', bytesType());
            expect(result).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
        });

        it('should convert JSON array string to Uint8Array', () => {
            const result = convertValue('[1, 2, 3, 255]', bytesType());
            expect(result).toEqual(new Uint8Array([1, 2, 3, 255]));
        });

        it('should convert empty hex string to empty Uint8Array', () => {
            // empty string returns null from the top-level guard
            expect(convertValue('00', bytesType())).toEqual(new Uint8Array([0]));
        });

        it('should accept 0x-prefixed hex', () => {
            expect(convertValue('0xdeadbeef', bytesType())).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
        });

        it('should pad odd-length hex (matches fromHex semantics)', () => {
            expect(convertValue('a', bytesType())).toEqual(new Uint8Array([0x0a]));
        });

        it('should pad odd-length 0x-prefixed hex', () => {
            expect(convertValue('0xabc', bytesType())).toEqual(new Uint8Array([0x0a, 0xbc]));
        });

        it('should throw for invalid hex characters', () => {
            expect(() => convertValue('zzzz', bytesType())).toThrow('Invalid hex character');
        });

        it('should throw for invalid JSON array', () => {
            expect(() => convertValue('[1, 2,', bytesType())).toThrow('Invalid bytes array');
        });

        it('should convert comma-separated decimal values with spaces to Uint8Array', () => {
            const result = convertValue('1, 1, 1, 1', bytesType());
            expect(result).toEqual(new Uint8Array([1, 1, 1, 1]));
        });

        it('should convert comma-separated decimal values without spaces', () => {
            const result = convertValue('1,2,3,255', bytesType());
            expect(result).toEqual(new Uint8Array([1, 2, 3, 255]));
        });

        it('should throw for comma-separated non-numeric values', () => {
            expect(() => convertValue('1, abc, 3', bytesType())).toThrow('Invalid bytes values');
        });

        it('should convert comma-separated values wrapped in fixedSizeTypeNode', () => {
            const type = fixedSizeType(bytesType(), 4);
            const result = convertValue('1, 1, 1, 1', type);
            expect(result).toEqual(new Uint8Array([1, 1, 1, 1]));
        });
    });

    describe('optionTypeNode', () => {
        it('should return null for "null"', () => {
            expect(convertValue('null', optionType(stringType()))).toBeNull();
        });

        it('should return null for "none"', () => {
            expect(convertValue('none', optionType(numberType('u8')))).toBeNull();
        });

        it('should unwrap and convert the inner value', () => {
            expect(convertValue('42', optionType(numberType('u64')))).toBe(BigInt(42));
        });

        it('should handle remainderOptionTypeNode', () => {
            const type = { item: numberType('u8'), kind: 'remainderOptionTypeNode' } as unknown as TypeNode;
            expect(convertValue('null', type)).toBeNull();
            expect(convertValue('42', type)).toBe(42);
        });

        it('should handle zeroableOptionTypeNode', () => {
            const type = { item: stringType(), kind: 'zeroableOptionTypeNode' } as unknown as TypeNode;
            expect(convertValue('none', type)).toBeNull();
            expect(convertValue('hello', type)).toBe('hello');
        });
    });

    describe('arrayTypeNode', () => {
        it('should parse JSON array of numbers', () => {
            const result = convertValue('[1, 2, 3]', arrayType(numberType('u8')));
            expect(result).toEqual([1, 2, 3]);
        });

        it('should parse JSON array of strings', () => {
            const result = convertValue('["Alice", "Bob"]', arrayType(stringType()));
            expect(result).toEqual(['Alice', 'Bob']);
        });

        it('should handle comma-separated strings (form input format)', () => {
            const result = convertValue('Alice, Bob', arrayType(stringType()));
            expect(result).toEqual(['Alice', 'Bob']);
        });

        it('should handle comma-separated numbers', () => {
            const result = convertValue('1, 2, 3', arrayType(numberType('u8')));
            expect(result).toEqual([1, 2, 3]);
        });

        it('should handle fixed-size array with comma-separated strings', () => {
            const result = convertValue('Alice, Bob', fixedArrayType(sizePrefixType(stringType()), 2));
            expect(result).toEqual(['Alice', 'Bob']);
        });

        it('should convert already-parsed array value', () => {
            const result = convertValue(['a', 'b'], arrayType(stringType()));
            expect(result).toEqual(['a', 'b']);
        });

        it('should wrap a non-array value in an array', () => {
            const result = convertValue(42, arrayType(numberType('u8')));
            expect(result).toEqual([42]);
        });

        it('should recursively convert array items with BigInt', () => {
            const result = convertValue('[100, 200]', arrayType(numberType('u64')));
            expect(result).toEqual([BigInt(100), BigInt(200)]);
        });

        it('should handle single comma-separated value', () => {
            const result = convertValue('hello', arrayType(stringType()));
            expect(result).toEqual(['hello']);
        });
    });

    describe('structTypeNode', () => {
        it('should parse JSON string and convert fields', () => {
            const type = structType([
                { name: 'name', type: stringType() },
                { name: 'amount', type: numberType('u64') },
            ]);
            const result = convertValue('{"name": "test", "amount": "100"}', type);
            expect(result).toEqual({ amount: BigInt(100), name: 'test' });
        });

        it('should handle object value directly', () => {
            const type = structType([
                { name: 'x', type: numberType('u8') },
                { name: 'y', type: numberType('u8') },
            ]);
            const result = convertValue({ x: '10', y: '20' }, type);
            expect(result).toEqual({ x: 10, y: 20 });
        });

        it('should return non-object as-is', () => {
            const type = structType([{ name: 'x', type: numberType('u8') }]);
            expect(convertValue('42', type)).toBe(42);
        });

        it('should convert missing field to null', () => {
            const type = structType([
                { name: 'a', type: numberType('u8') },
                { name: 'b', type: numberType('u8') },
            ]);
            const result = convertValue({ a: '5' }, type);
            expect(result).toEqual({ a: 5, b: null });
        });
    });

    describe('enumTypeNode', () => {
        it('should return simple string variant', () => {
            const type = enumType([{ name: 'Active' }, { name: 'Inactive' }]);
            expect(convertValue('Active', type)).toBe('Active');
        });

        it('should parse JSON object variant', () => {
            const type = enumType([{ name: 'Transfer' }]);
            const result = convertValue('{"Transfer": {"amount": 100}}', type);
            expect(result).toEqual({ Transfer: { amount: 100 } });
        });

        it('should throw for invalid JSON object variant', () => {
            const type = enumType([{ name: 'Transfer' }]);
            expect(() => convertValue('{invalid', type)).toThrow('Invalid JSON for enum');
        });
    });

    describe('tupleTypeNode', () => {
        it('should parse JSON tuple and convert each item', () => {
            const type = tupleType([numberType('u8'), stringType(), numberType('u64')]);
            const result = convertValue('[1, "hello", "999"]', type);
            expect(result).toEqual([1, 'hello', BigInt(999)]);
        });

        it('should return non-array parsed value as-is', () => {
            const type = tupleType([numberType('u8')]);
            expect(convertValue('42', type)).toBe(42);
        });

        it('should pass through extra items beyond type definitions', () => {
            const type = tupleType([numberType('u8')]);
            const result = convertValue('[1, "extra"]', type);
            expect(result).toEqual([1, 'extra']);
        });

        it('should handle already-parsed array value', () => {
            const type = tupleType([numberType('u8'), stringType()]);
            const result = convertValue([10, 'hello'], type);
            expect(result).toEqual([10, 'hello']);
        });
    });

    describe('definedTypeLinkNode', () => {
        it('should resolve defined type and convert', () => {
            const root = rootWithDefinedType('candidateName', structType([{ name: 'name', type: stringType() }]));
            const type = definedTypeLinkType('candidateName');
            const result = convertValue('{"name": "Alice"}', type, root);
            expect(result).toEqual({ name: 'Alice' });
        });

        it('should return value as-is when root is not provided', () => {
            const type = definedTypeLinkType('candidateName');
            expect(convertValue('test', type)).toBe('test');
        });

        it('should throw error when definedTypeLinkNode references a missing node in IDL', () => {
            const root = rootWithDefinedType('other', stringType());
            const type = definedTypeLinkType('Missing');
            expect(() => convertValue('x', type, root)).toThrow(
                // eslint-disable-next-line no-restricted-syntax -- case-insensitive regex matcher for error message
                /defined type "Missing" not found/i,
            );
        });
    });

    describe('wrapper type nodes', () => {
        it('should unwrap fixedSizeTypeNode', () => {
            const type = fixedSizeType(bytesType(), 8);
            const result = convertValue('deadbeef01020304', type);
            expect(result).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x01, 0x02, 0x03, 0x04]));
        });

        it('should unwrap sizePrefixTypeNode', () => {
            const type = sizePrefixType(stringType());
            expect(convertValue('hello', type)).toBe('hello');
        });

        it('should unwrap solAmountTypeNode to BigInt', () => {
            expect(convertValue('1000000000', solAmountType())).toBe(BigInt(1000000000));
        });

        it('should unwrap dateTimeTypeNode to BigInt', () => {
            expect(convertValue('1700000000', dateTimeType())).toBe(BigInt(1700000000));
        });

        it('should unwrap amountTypeNode', () => {
            expect(convertValue('500', amountType())).toBe(BigInt(500));
        });

        it('should unwrap postOffsetTypeNode', () => {
            const type = wrapperType('postOffsetTypeNode', stringType());
            expect(convertValue('hello', type)).toBe('hello');
        });

        it('should unwrap preOffsetTypeNode', () => {
            const type = wrapperType('preOffsetTypeNode', numberType('u8'));
            expect(convertValue('42', type)).toBe(42);
        });

        it('should unwrap sentinelTypeNode', () => {
            const type = wrapperType('sentinelTypeNode', stringType());
            expect(convertValue('test', type)).toBe('test');
        });

        it('should unwrap hiddenPrefixTypeNode', () => {
            const type = wrapperType('hiddenPrefixTypeNode', numberType('u64'));
            expect(convertValue('100', type)).toBe(BigInt(100));
        });

        it('should unwrap hiddenSuffixTypeNode', () => {
            const type = wrapperType('hiddenSuffixTypeNode', stringType());
            expect(convertValue('data', type)).toBe('data');
        });
    });

    describe('setTypeNode', () => {
        it('should parse JSON array like arrayTypeNode', () => {
            const type = setType(numberType('u8'));
            const result = convertValue('[1, 2, 3]', type);
            expect(result).toEqual([1, 2, 3]);
        });

        it('should convert set items to BigInt for u64', () => {
            const type = setType(numberType('u64'));
            const result = convertValue('[100, 200]', type);
            expect(result).toEqual([BigInt(100), BigInt(200)]);
        });

        it('should handle comma-separated input', () => {
            const type = setType(stringType());
            expect(convertValue('a, b, c', type)).toEqual(['a', 'b', 'c']);
        });
    });

    describe('mapTypeNode', () => {
        it('should parse JSON map', () => {
            const type = mapType(stringType(), numberType('u8'));
            const result = convertValue('{"a": 1, "b": 2}', type);
            expect(result).toEqual({ a: 1, b: 2 });
        });

        it('should pass through already-parsed object value', () => {
            const type = mapType(stringType(), numberType('u8'));
            const obj = { x: 10 };
            expect(convertValue(obj, type)).toStrictEqual({ x: 10 });
        });

        it('should convert map values to BigInt for u64', () => {
            const type = mapType(stringType(), numberType('u64'));
            expect(convertValue({ a: '100' }, type)).toStrictEqual({ a: BigInt(100) });
        });

        it('should return non-object parsed value as-is', () => {
            const type = mapType(stringType(), numberType('u8'));
            expect(convertValue('42', type)).toBe(42);
        });

        it('should return null for null parsed value', () => {
            const type = mapType(stringType(), numberType('u8'));
            expect(convertValue('null', type)).toBeNull();
        });

        it('should recursively convert nested struct values in map', () => {
            const innerStruct = structType([{ name: 'amount', type: numberType('u64') }]);
            const type = mapType(stringType(), innerStruct);
            const result = convertValue({ key1: { amount: '999' } }, type);
            expect(result).toStrictEqual({ key1: { amount: BigInt(999) } });
        });
    });

    describe('unknown type node', () => {
        it('should return value as-is for unrecognized kinds', () => {
            const type = { kind: 'someUnknownTypeNode' } as unknown as TypeNode;
            expect(convertValue('hello', type)).toBe('hello');
        });
    });
});

describe('getUserFacingArguments', () => {
    it('should filter out omitted arguments', () => {
        const node = {
            arguments: [
                { defaultValueStrategy: 'omitted', docs: [], name: 'discriminator', type: bytesType() },
                { defaultValueStrategy: undefined, docs: [], name: 'amount', type: numberType('u64') },
                { defaultValueStrategy: undefined, docs: [], name: 'name', type: stringType() },
            ],
        };
        const result = getUserFacingArguments(node as any);
        expect(result).toHaveLength(2);
        expect(result.map(a => a.name)).toEqual(['amount', 'name']);
    });

    it('should return all arguments when none are omitted', () => {
        const node = {
            arguments: [
                { docs: [], name: 'a', type: numberType('u8') },
                { docs: [], name: 'b', type: stringType() },
            ],
        };
        const result = getUserFacingArguments(node as any);
        expect(result).toHaveLength(2);
    });

    it('should return empty array when all are omitted', () => {
        const node = {
            arguments: [{ defaultValueStrategy: 'omitted', docs: [], name: 'disc', type: bytesType() }],
        };
        const result = getUserFacingArguments(node as any);
        expect(result).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// Helper factories for TypeNode literals
// Cast through `unknown` because codama uses branded string types
// (e.g. CamelCaseString) that plain string literals don't satisfy.
// ---------------------------------------------------------------------------
const numberType = (format: string): TypeNode =>
    ({ endian: 'le', format, kind: 'numberTypeNode' }) as unknown as TypeNode;

const booleanType = (): TypeNode =>
    ({ kind: 'booleanTypeNode', size: { endian: 'le', format: 'u8', kind: 'numberTypeNode' } }) as unknown as TypeNode;

const publicKeyType = (): TypeNode => ({ kind: 'publicKeyTypeNode' }) as unknown as TypeNode;

const stringType = (): TypeNode => ({ encoding: 'utf8', kind: 'stringTypeNode' }) as unknown as TypeNode;

const bytesType = (): TypeNode => ({ kind: 'bytesTypeNode' }) as unknown as TypeNode;

const arrayType = (item: TypeNode, count?: object): TypeNode =>
    ({
        count: count ?? { kind: 'prefixedCountNode', prefix: numberType('u32') },
        item,
        kind: 'arrayTypeNode',
    }) as unknown as TypeNode;

const fixedArrayType = (item: TypeNode, length: number): TypeNode =>
    arrayType(item, { kind: 'fixedCountNode', value: length });

const optionType = (item: TypeNode): TypeNode =>
    ({
        fixed: false,
        item,
        kind: 'optionTypeNode',
        prefix: numberType('u8'),
    }) as unknown as TypeNode;

const structType = (fields: Array<{ name: string; type: TypeNode }>): TypeNode =>
    ({
        fields: fields.map(f => ({
            docs: [],
            kind: 'structFieldTypeNode',
            name: f.name,
            type: f.type,
        })),
        kind: 'structTypeNode',
    }) as unknown as TypeNode;

const enumType = (variants: Array<{ name: string }>): TypeNode =>
    ({
        kind: 'enumTypeNode',
        variants: variants.map(v => ({
            kind: 'enumEmptyVariantTypeNode',
            name: v.name,
        })),
    }) as unknown as TypeNode;

const tupleType = (items: TypeNode[]): TypeNode => ({ items, kind: 'tupleTypeNode' }) as unknown as TypeNode;

const fixedSizeType = (type: TypeNode, size: number): TypeNode =>
    ({ kind: 'fixedSizeTypeNode', size, type }) as unknown as TypeNode;

const sizePrefixType = (type: TypeNode): TypeNode =>
    ({
        kind: 'sizePrefixTypeNode',
        prefix: numberType('u32'),
        type,
    }) as unknown as TypeNode;

const definedTypeLinkType = (name: string): TypeNode => ({ kind: 'definedTypeLinkNode', name }) as unknown as TypeNode;

const mapType = (key: TypeNode, value: TypeNode): TypeNode =>
    ({
        count: { kind: 'prefixedCountNode', prefix: numberType('u32') },
        key,
        kind: 'mapTypeNode',
        value,
    }) as unknown as TypeNode;

const setType = (item: TypeNode): TypeNode =>
    ({
        count: { kind: 'prefixedCountNode', prefix: numberType('u32') },
        item,
        kind: 'setTypeNode',
    }) as unknown as TypeNode;

const solAmountType = (): TypeNode =>
    ({
        kind: 'solAmountTypeNode',
        number: numberType('u64'),
    }) as unknown as TypeNode;

const amountType = (): TypeNode =>
    ({
        kind: 'amountTypeNode',
        number: numberType('u64'),
    }) as unknown as TypeNode;

const dateTimeType = (): TypeNode =>
    ({
        kind: 'dateTimeTypeNode',
        number: numberType('i64'),
    }) as unknown as TypeNode;

const wrapperType = (kind: string, type: TypeNode): TypeNode => ({ kind, type }) as unknown as TypeNode;

// Minimal RootNode with a defined type for testing definedTypeLinkNode
function rootWithDefinedType(name: string, type: TypeNode): RootNode {
    return {
        additionalPrograms: [],
        kind: 'rootNode',
        program: {
            accounts: [],
            definedTypes: [
                {
                    docs: [],
                    kind: 'definedTypeNode',
                    name,
                    type,
                },
            ],
            docs: [],
            errors: [],
            instructions: [],
            kind: 'programNode',
            name: 'test',
            origin: 'anchor',
            pdas: [],
            publicKey: '11111111111111111111111111111111',
            version: '0.1.0',
        },
        standard: 'codama',
        version: '1.0.0',
    } as unknown as RootNode;
}
