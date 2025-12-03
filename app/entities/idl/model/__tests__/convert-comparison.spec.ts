import { privateConvertType as convertDisplayType } from '../converters/convert-display-idl';
import { privateConvertType as convertLegacyType } from '../converters/convert-legacy-idl';
import { privateConvertType as convertReferenceType } from '../converters/convert-reference-legacy-idl';

describe('convert idl comparison', () => {
    /**
     * Specs that cover implementation from @solana-developers/helpers as well as existing Explorer's implementaiton
     * That is needed to see real difference between converters that are used to represent and interact with IDLs
     */
    describe('convertType', () => {
        describe('should parse leaves', () => {
            const leavesTypeArg = { name: 'leaves', type: { vec: { defined: '(u8,[u8;32])' } } };
            const leavesTypeArgWithSemicolon = { name: 'leaves', type: { vec: { defined: '(u8,[u8,32])' } } };

            it.each([
                {
                    convertType: convertReferenceType,
                    expected: { vec: { defined: { generics: [], name: '(u8,[u8;32])' } } },
                    input: leavesTypeArg,
                    name: 'convertReference',
                },
                {
                    convertType: convertDisplayType,
                    expected: { vec: { defined: { generics: [], name: '(u8,[u8;32])' } } },
                    input: leavesTypeArg,
                    name: 'convertDisplay',
                },
                {
                    convertType: convertLegacyType,
                    expected: { vec: { array: ['u8', 33] } },
                    input: leavesTypeArg,
                    name: 'convertLegacy',
                },
                {
                    convertType: convertReferenceType,
                    expected: { vec: { defined: { generics: [], name: '(u8,[u8,32])' } } },
                    input: leavesTypeArgWithSemicolon,
                    name: 'convertReference',
                },
                {
                    convertType: convertDisplayType,
                    expected: { vec: { defined: { generics: [], name: '(u8,[u8,32])' } } },
                    input: leavesTypeArgWithSemicolon,
                    name: 'convertDisplay',
                },
                {
                    convertType: convertLegacyType,
                    expected: { vec: { array: ['u8', 33] } },
                    input: leavesTypeArgWithSemicolon,
                    name: 'convertLegacy',
                },
            ])(
                `should parse leaf type "${leavesTypeArg.type.vec.defined}" with $name`,
                ({ input, convertType, expected }) => {
                    expect(convertType(input.type)).toEqual(expected);
                }
            );
        });

        describe('should parse tuples', () => {
            const u64TupleOption = { option: { tuple: ['u64', 'u64'] } };
            const stringTupleVec = { vec: { tuple: ['string', 'string'] } };

            it.each(
                [
                    {
                        convertType: convertReferenceType,
                        expect: null,
                        expectToThrow: new Error('Unsupported type: {"tuple":["u64","u64"]}'),
                        name: 'convertReference',
                    },
                    {
                        convertType: convertDisplayType,
                        expectToThrow: null,
                        expected: {
                            option: {
                                defined: {
                                    generics: [
                                        { kind: 'type', type: 'u64' },
                                        { kind: 'type', type: 'u64' },
                                    ],
                                    name: 'tuple[u64]',
                                },
                            },
                        },
                        name: 'convertDisplay',
                    },
                    {
                        convertType: convertLegacyType,
                        expectToThrow: null,
                        expected: { option: { array: ['u64', 2] } },
                        name: 'convertLegacy',
                    },
                ].map(a => ({ ...a, input: u64TupleOption }))
            )(
                `should parse tuple type "${u64TupleOption.option.tuple}" with $name`,
                //@ts-expect-error expected | expectedToThrow
                ({ input, convertType, expected, expectedToThrow }) => {
                    if (expected) {
                        expect(convertType(input as any)).toEqual(expected);
                    } else if (expectedToThrow) {
                        expect(() => convertType(input)).toThrow(expectedToThrow);
                    }
                }
            );

            it.each(
                [
                    {
                        convertType: convertReferenceType,
                        expect: null,
                        expectToThrow: new Error('Unsupported type: {"tuple":["string","string"]}'),
                        name: 'convertReference',
                    },
                    {
                        convertType: convertDisplayType,
                        expectToThrow: null,
                        expected: {
                            vec: {
                                defined: {
                                    generics: [
                                        { kind: 'type', type: 'string' },
                                        { kind: 'type', type: 'string' },
                                    ],
                                    name: 'tuple[string]',
                                },
                            },
                        },
                        name: 'convertDisplay',
                    },
                    {
                        convertType: convertLegacyType,
                        expectToThrow: null,
                        expected: { vec: { array: ['string', 2] } },
                        name: 'convertLegacy',
                    },
                ].map(a => ({ ...a, input: stringTupleVec }))
            )(
                `should parse tuple type "${stringTupleVec.vec.tuple}" with $name`,
                //@ts-expect-error expected | expectedToThrow
                ({ input, convertType, expected, expectedToThrow }) => {
                    if (expected) {
                        expect(convertType(input as any)).toEqual(expected);
                    } else if (expectedToThrow) {
                        expect(() => convertType(input)).toThrow(expectedToThrow);
                    }
                }
            );
        });
    });
});
