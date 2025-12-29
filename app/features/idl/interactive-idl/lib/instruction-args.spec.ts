import type { IdlType } from '@coral-xyz/anchor/dist/cjs/idl';
import type { ArgField } from '@entities/idl';
import { describe, expect, it } from 'vitest';

import { getArrayLengthFromIdlType, isArrayArg, isRequiredArg, isVectorArg } from './instruction-args';

describe('isRequiredArg', () => {
    describe('required arguments', () => {
        it('should return true for simple types', () => {
            const arg: ArgField = {
                docs: [],
                name: 'amount',
                type: 'u64',
            };
            expect(isRequiredArg(arg)).toBe(true);
        });

        it('should return true for complex types', () => {
            const arg: ArgField = {
                docs: [],
                name: 'data',
                type: 'Vec<u8>',
            };
            expect(isRequiredArg(arg)).toBe(true);
        });

        it('should return true for custom struct types', () => {
            const arg: ArgField = {
                docs: [],
                name: 'config',
                type: 'MyStruct',
            };
            expect(isRequiredArg(arg)).toBe(true);
        });

        it('should return true for types containing "option" but not starting with it', () => {
            const arg: ArgField = {
                docs: [],
                name: 'value',
                type: 'MyOptionType',
            };
            expect(isRequiredArg(arg)).toBe(true);
        });

        it('should return true for types with "option" in the middle', () => {
            const arg: ArgField = {
                docs: [],
                name: 'value',
                type: 'Vec<option(u64)>',
            };
            expect(isRequiredArg(arg)).toBe(true);
        });
    });

    describe('optional arguments', () => {
        it('should return false for option(u64)', () => {
            const arg: ArgField = {
                docs: [],
                name: 'amount',
                type: 'option(u64)',
            };
            expect(isRequiredArg(arg)).toBe(false);
        });

        it('should return false for option(string)', () => {
            const arg: ArgField = {
                docs: [],
                name: 'name',
                type: 'option(string)',
            };
            expect(isRequiredArg(arg)).toBe(false);
        });

        it('should return false for option(publicKey)', () => {
            const arg: ArgField = {
                docs: [],
                name: 'owner',
                type: 'option(publicKey)',
            };
            expect(isRequiredArg(arg)).toBe(false);
        });

        it('should return false for nested option types', () => {
            const arg: ArgField = {
                docs: [],
                name: 'config',
                type: 'option(MyStruct)',
            };
            expect(isRequiredArg(arg)).toBe(false);
        });

        it('should return false for coption(u64)', () => {
            const arg: ArgField = {
                docs: [],
                name: 'amount',
                type: 'coption(u64)',
            };
            expect(isRequiredArg(arg)).toBe(false);
        });

        it('should return false for coption(string)', () => {
            const arg: ArgField = {
                docs: [],
                name: 'name',
                type: 'coption(string)',
            };
            expect(isRequiredArg(arg)).toBe(false);
        });

        it('should return false for coption(publicKey)', () => {
            const arg: ArgField = {
                docs: [],
                name: 'owner',
                type: 'coption(publicKey)',
            };
            expect(isRequiredArg(arg)).toBe(false);
        });

        it('should return false for nested coption types', () => {
            const arg: ArgField = {
                docs: [],
                name: 'config',
                type: 'coption(MyStruct)',
            };
            expect(isRequiredArg(arg)).toBe(false);
        });

        it('should return false for option(vec(u8))', () => {
            const arg: ArgField = {
                docs: [],
                name: 'optionalItems',
                type: 'option(vec(u8))',
            };
            expect(isRequiredArg(arg)).toBe(false);
        });

        it('should return false for coption(array(u8, 32))', () => {
            const arg: ArgField = {
                docs: [],
                name: 'optionalData',
                type: 'coption(array(u8, 32))',
            };
            expect(isRequiredArg(arg)).toBe(false);
        });
    });

    describe('edge cases', () => {
        it('should return true for empty string type', () => {
            const arg: ArgField = {
                docs: [],
                name: 'value',
                type: '',
            };
            expect(isRequiredArg(arg)).toBe(true);
        });

        it('should handle case sensitivity correctly', () => {
            const arg: ArgField = {
                docs: [],
                name: 'value',
                type: 'Option(u64)',
            };
            expect(isRequiredArg(arg)).toBe(true);
        });

        it('should handle COption case sensitivity', () => {
            const arg: ArgField = {
                docs: [],
                name: 'value',
                type: 'COption(u64)',
            };
            expect(isRequiredArg(arg)).toBe(true);
        });
    });
});

describe('isArrayArg', () => {
    describe('array arguments', () => {
        it('should return true for simple array types', () => {
            const arg: ArgField = {
                docs: [],
                name: 'data',
                type: 'array(u8, 32)',
            };
            expect(isArrayArg(arg)).toBe(true);
        });

        it('should return true for array(bool, 3)', () => {
            const arg: ArgField = {
                docs: [],
                name: 'flags',
                type: 'array(bool, 3)',
            };
            expect(isArrayArg(arg)).toBe(true);
        });

        it('should return true for array(publicKey, 2)', () => {
            const arg: ArgField = {
                docs: [],
                name: 'keys',
                type: 'array(publicKey, 2)',
            };
            expect(isArrayArg(arg)).toBe(true);
        });

        it('should return true for option(array(bool, 3))', () => {
            const arg: ArgField = {
                docs: [],
                name: 'optionalFlags',
                type: 'option(array(bool, 3))',
            };
            expect(isArrayArg(arg)).toBe(true);
        });

        it('should return true for coption(array(u8, 32))', () => {
            const arg: ArgField = {
                docs: [],
                name: 'optionalData',
                type: 'coption(array(u8, 32))',
            };
            expect(isArrayArg(arg)).toBe(true);
        });
    });

    describe('non-array arguments', () => {
        it('should return false for simple types', () => {
            const arg: ArgField = {
                docs: [],
                name: 'amount',
                type: 'u64',
            };
            expect(isArrayArg(arg)).toBe(false);
        });

        it('should return false for vector types', () => {
            const arg: ArgField = {
                docs: [],
                name: 'items',
                type: 'vec(u8)',
            };
            expect(isArrayArg(arg)).toBe(false);
        });

        it('should return false for option types', () => {
            const arg: ArgField = {
                docs: [],
                name: 'value',
                type: 'option(u64)',
            };
            expect(isArrayArg(arg)).toBe(false);
        });

        it('should return false for types containing "array" but not as array(', () => {
            const arg: ArgField = {
                docs: [],
                name: 'value',
                type: 'MyArrayType',
            };
            expect(isArrayArg(arg)).toBe(false);
        });

        it('should return false for empty string type', () => {
            const arg: ArgField = {
                docs: [],
                name: 'value',
                type: '',
            };
            expect(isArrayArg(arg)).toBe(false);
        });
    });
});

describe('isVectorArg', () => {
    describe('vector arguments', () => {
        it('should return true for simple vector types', () => {
            const arg: ArgField = {
                docs: [],
                name: 'items',
                type: 'vec(u8)',
            };
            expect(isVectorArg(arg)).toBe(true);
        });

        it('should return true for vec(publicKey)', () => {
            const arg: ArgField = {
                docs: [],
                name: 'keys',
                type: 'vec(publicKey)',
            };
            expect(isVectorArg(arg)).toBe(true);
        });

        it('should return true for vec(string)', () => {
            const arg: ArgField = {
                docs: [],
                name: 'names',
                type: 'vec(string)',
            };
            expect(isVectorArg(arg)).toBe(true);
        });

        it('should return true for option(vec(u8))', () => {
            const arg: ArgField = {
                docs: [],
                name: 'optionalItems',
                type: 'option(vec(u8))',
            };
            expect(isVectorArg(arg)).toBe(true);
        });

        it('should return true for coption(vec(publicKey))', () => {
            const arg: ArgField = {
                docs: [],
                name: 'optionalKeys',
                type: 'coption(vec(publicKey))',
            };
            expect(isVectorArg(arg)).toBe(true);
        });

        it('should return true for vec(RemainingAccountsSlice)', () => {
            const arg: ArgField = {
                docs: [],
                name: 'accounts',
                type: 'vec(RemainingAccountsSlice)',
            };
            expect(isVectorArg(arg)).toBe(true);
        });
    });

    describe('non-vector arguments', () => {
        it('should return false for simple types', () => {
            const arg: ArgField = {
                docs: [],
                name: 'amount',
                type: 'u64',
            };
            expect(isVectorArg(arg)).toBe(false);
        });

        it('should return false for array types', () => {
            const arg: ArgField = {
                docs: [],
                name: 'data',
                type: 'array(u8, 32)',
            };
            expect(isVectorArg(arg)).toBe(false);
        });

        it('should return false for option types', () => {
            const arg: ArgField = {
                docs: [],
                name: 'value',
                type: 'option(u64)',
            };
            expect(isVectorArg(arg)).toBe(false);
        });

        it('should return false for types containing "vec" but not as vec(', () => {
            const arg: ArgField = {
                docs: [],
                name: 'value',
                type: 'MyVectorType',
            };
            expect(isVectorArg(arg)).toBe(false);
        });

        it('should return false for empty string type', () => {
            const arg: ArgField = {
                docs: [],
                name: 'value',
                type: '',
            };
            expect(isVectorArg(arg)).toBe(false);
        });
    });
});

describe('getArrayLengthFromIdlType', () => {
    describe('array types with length', () => {
        it('should return length for simple array types', () => {
            const type: IdlType = { array: ['u8', 32] };
            expect(getArrayLengthFromIdlType(type)).toBe(32);
        });

        it('should return length for array of strings', () => {
            const type: IdlType = { array: ['string', 2] };
            expect(getArrayLengthFromIdlType(type)).toBe(2);
        });

        it('should return length for array of bools', () => {
            const type: IdlType = { array: ['bool', 3] };
            expect(getArrayLengthFromIdlType(type)).toBe(3);
        });

        it('should return length for array of pubkeys', () => {
            const type: IdlType = { array: ['pubkey', 5] };
            expect(getArrayLengthFromIdlType(type)).toBe(5);
        });
    });

    describe('optional array types', () => {
        it('should return length for option(array)', () => {
            const type: IdlType = { option: { array: ['u8', 16] } };
            expect(getArrayLengthFromIdlType(type)).toBe(16);
        });

        it('should return length for coption(array)', () => {
            const type: IdlType = { coption: { array: ['string', 10] } };
            expect(getArrayLengthFromIdlType(type)).toBe(10);
        });
    });

    describe('types without length', () => {
        it('should return undefined for vector types', () => {
            const type: IdlType = { vec: 'u8' };
            expect(getArrayLengthFromIdlType(type)).toBeUndefined();
        });

        it('should return undefined for array with generic length', () => {
            const type: IdlType = { array: ['u8', { generic: 'N' }] };
            expect(getArrayLengthFromIdlType(type)).toBeUndefined();
        });

        it('should return undefined for simple types', () => {
            const type: IdlType = 'u64';
            expect(getArrayLengthFromIdlType(type)).toBeUndefined();
        });

        it('should return undefined for option of non-array', () => {
            const type: IdlType = { option: 'u64' };
            expect(getArrayLengthFromIdlType(type)).toBeUndefined();
        });

        it('should return undefined for coption of non-array', () => {
            const type: IdlType = { coption: 'pubkey' };
            expect(getArrayLengthFromIdlType(type)).toBeUndefined();
        });

        it('should return undefined for option(vec)', () => {
            const type: IdlType = { option: { vec: 'u8' } };
            expect(getArrayLengthFromIdlType(type)).toBeUndefined();
        });

        it('should return undefined for coption(vec)', () => {
            const type: IdlType = { coption: { vec: 'u8' } };
            expect(getArrayLengthFromIdlType(type)).toBeUndefined();
        });
    });

    describe('edge cases', () => {
        it('should handle large array lengths', () => {
            const type: IdlType = { array: ['u8', 1000] };
            expect(getArrayLengthFromIdlType(type)).toBe(1000);
        });

        it('should handle single element arrays', () => {
            const type: IdlType = { array: ['u8', 1] };
            expect(getArrayLengthFromIdlType(type)).toBe(1);
        });

        it('should return undefined for defined types', () => {
            const type: IdlType = { defined: { generics: [], name: 'MyStruct' } };
            expect(getArrayLengthFromIdlType(type)).toBeUndefined();
        });
    });
});
