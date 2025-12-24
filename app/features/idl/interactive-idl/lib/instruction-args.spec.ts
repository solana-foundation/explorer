import type { ArgField } from '@entities/idl';
import { describe, expect, it } from 'vitest';

import { getArrayMaxLength, isArrayArg, isRequiredArg, isVectorArg } from './instruction-args';

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

describe('getArrayMaxLength', () => {
    describe('array types with length', () => {
        it('should return length for simple array types', () => {
            const arg: ArgField = {
                docs: [],
                name: 'data',
                type: 'array(u8, 32)',
            };
            expect(getArrayMaxLength(arg)).toBe(32);
        });

        it('should return length for array(string, 2)', () => {
            const arg: ArgField = {
                docs: [],
                name: 'items',
                type: 'array(string, 2)',
            };
            expect(getArrayMaxLength(arg)).toBe(2);
        });

        it('should return length for array(bool, 3)', () => {
            const arg: ArgField = {
                docs: [],
                name: 'flags',
                type: 'array(bool, 3)',
            };
            expect(getArrayMaxLength(arg)).toBe(3);
        });

        it('should return length for array(publicKey, 5)', () => {
            const arg: ArgField = {
                docs: [],
                name: 'keys',
                type: 'array(publicKey, 5)',
            };
            expect(getArrayMaxLength(arg)).toBe(5);
        });

        it('should handle spaces in array type', () => {
            const arg: ArgField = {
                docs: [],
                name: 'data',
                type: 'array( u8 , 64 )',
            };
            expect(getArrayMaxLength(arg)).toBe(64);
        });
    });

    describe('optional array types', () => {
        it('should return length for option(array(u8, 16))', () => {
            const arg: ArgField = {
                docs: [],
                name: 'optionalData',
                type: 'option(array(u8, 16))',
            };
            expect(getArrayMaxLength(arg)).toBe(16);
        });

        it('should return length for coption(array(string, 10))', () => {
            const arg: ArgField = {
                docs: [],
                name: 'optionalItems',
                type: 'coption(array(string, 10))',
            };
            expect(getArrayMaxLength(arg)).toBe(10);
        });
    });

    describe('types without length', () => {
        it('should return undefined for vector types', () => {
            const arg: ArgField = {
                docs: [],
                name: 'items',
                type: 'vec(u8)',
            };
            expect(getArrayMaxLength(arg)).toBeUndefined();
        });

        it('should return undefined for array without length', () => {
            const arg: ArgField = {
                docs: [],
                name: 'items',
                type: 'array(u8)',
            };
            expect(getArrayMaxLength(arg)).toBeUndefined();
        });

        it('should return undefined for simple types', () => {
            const arg: ArgField = {
                docs: [],
                name: 'amount',
                type: 'u64',
            };
            expect(getArrayMaxLength(arg)).toBeUndefined();
        });

        it('should return undefined for option types', () => {
            const arg: ArgField = {
                docs: [],
                name: 'value',
                type: 'option(u64)',
            };
            expect(getArrayMaxLength(arg)).toBeUndefined();
        });
    });

    describe('edge cases', () => {
        it('should handle large array lengths', () => {
            const arg: ArgField = {
                docs: [],
                name: 'large',
                type: 'array(u8, 1000)',
            };
            expect(getArrayMaxLength(arg)).toBe(1000);
        });

        it('should handle single digit lengths', () => {
            const arg: ArgField = {
                docs: [],
                name: 'small',
                type: 'array(u8, 1)',
            };
            expect(getArrayMaxLength(arg)).toBe(1);
        });

        it('should return undefined for empty string type', () => {
            const arg: ArgField = {
                docs: [],
                name: 'value',
                type: '',
            };
            expect(getArrayMaxLength(arg)).toBeUndefined();
        });
    });
});
