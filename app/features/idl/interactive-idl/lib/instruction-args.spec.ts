import type { IdlType } from '@coral-xyz/anchor/dist/cjs/idl';
import type { ArgField } from '@entities/idl';
import { describe, expect, it } from 'vitest';

import { getArrayLengthFromIdlType, isArrayArg, isRequiredArg, isVectorArg } from './instruction-args';

const createArg = (name: string, type: string, rawType?: IdlType): ArgField => ({
    docs: [],
    name,
    type,
    ...(rawType !== undefined && { rawType }),
});

// Arguments with rawType (primary detection path)
const argsWithRaw = {
    arrayBool3: createArg('flags', 'array(bool, 3)', { array: ['bool', 3] }),
    arrayU8: createArg('data', 'array(u8, 32)', { array: ['u8', 32] }),
    coptionArrayU8: createArg('optionalData', 'coption(array(u8, 32))', { coption: { array: ['u8', 32] } }),
    coptionPubkey: createArg('owner', 'coption(publicKey)', { coption: 'pubkey' }),
    coptionVecPubkey: createArg('optionalKeys', 'coption(vec(publicKey))', { coption: { vec: 'pubkey' } }),
    optionArrayU8: createArg('optionalData', 'option(array(u8, 32))', { option: { array: ['u8', 32] } }),
    optionU64: createArg('amount', 'option(u64)', { option: 'u64' }),
    optionVecU8: createArg('optionalVec', 'option(vec(u8))', { option: { vec: 'u8' } }),
    struct: createArg('config', 'MyStruct', { defined: { generics: [], name: 'MyStruct' } }),
    u64: createArg('amount', 'u64', 'u64'),
    vecPubkey: createArg('keys', 'vec(publicKey)', { vec: 'pubkey' }),
    vecU8: createArg('data', 'vec(u8)', { vec: 'u8' }),
};

// Arguments without rawType (fallback regex path)
const args = {
    arrayBool3: createArg('flags', 'array(bool, 3)'),
    arrayPubkey2: createArg('keys', 'array(publicKey, 2)'),
    arrayU8: createArg('data', 'array(u8, 32)'),
    coptionArrayU8: createArg('optionalData', 'coption(array(u8, 32))'),
    coptionPubkey: createArg('owner', 'coption(publicKey)'),
    coptionU64: createArg('amount', 'coption(u64)'),
    coptionUpperCase: createArg('value', 'COption(u64)'),
    coptionVecPubkey: createArg('optionalKeys', 'coption(vec(publicKey))'),
    empty: createArg('value', ''),
    myArrayType: createArg('value', 'MyArrayType'),
    myOptionType: createArg('value', 'MyOptionType'),
    myVectorType: createArg('value', 'MyVectorType'),
    optionArrayBool3: createArg('optionalFlags', 'option(array(bool, 3))'),
    optionU64: createArg('amount', 'option(u64)'),
    optionUpperCase: createArg('value', 'Option(u64)'),
    optionVecU8: createArg('optionalItems', 'option(vec(u8))'),
    struct: createArg('config', 'MyStruct'),
    u64: createArg('amount', 'u64'),
    vecAngleBracket: createArg('data', 'Vec<u8>'),
    vecPubkey: createArg('keys', 'vec(publicKey)'),
    vecString: createArg('names', 'vec(string)'),
    vecStruct: createArg('accounts', 'vec(RemainingAccountsSlice)'),
    vecU8: createArg('data', 'vec(u8)'),
    vecWithOptionInside: createArg('value', 'Vec<option(u64)>'),
};

describe('isRequiredArg', () => {
    describe('required arguments', () => {
        it.each([
            ['simple string rawType', argsWithRaw.u64],
            ['vec rawType', argsWithRaw.vecU8],
            ['array rawType', argsWithRaw.arrayU8],
            ['defined rawType', argsWithRaw.struct],
        ])('should return true for %s', (_, arg) => {
            expect(isRequiredArg(arg)).toBe(true);
        });
    });

    describe('optional arguments', () => {
        it.each([
            ['option rawType', argsWithRaw.optionU64],
            ['coption rawType', argsWithRaw.coptionPubkey],
            ['nested option rawType', argsWithRaw.optionVecU8],
            ['coption wrapping array rawType', argsWithRaw.coptionArrayU8],
        ])('should return false for %s', (_, arg) => {
            expect(isRequiredArg(arg)).toBe(false);
        });
    });

    describe('should parse argument with a fallback', () => {
        it.each([
            ['simple types', args.u64],
            ['complex types', args.vecAngleBracket],
            ['custom struct types', args.struct],
            ['types containing "option" but not starting with it', args.myOptionType],
            ['types with "option" in the middle', args.vecWithOptionInside],
            ['empty string type', args.empty],
        ])('should return true for %s', (_, arg) => {
            expect(isRequiredArg(arg)).toBe(true);
        });

        it.each([
            ['option(u64)', args.optionU64],
            ['coption(u64)', args.coptionU64],
            ['Option(u64) case insensitive', args.optionUpperCase],
            ['COption(u64) case insensitive', args.coptionUpperCase],
        ])('should return false for %s', (_, arg) => {
            expect(isRequiredArg(arg)).toBe(false);
        });
    });
});

describe('isArrayArg', () => {
    describe('array arguments', () => {
        it.each([
            ['array rawType', argsWithRaw.arrayU8],
            ['array(bool, 3) rawType', argsWithRaw.arrayBool3],
            ['option(array) rawType', argsWithRaw.optionArrayU8],
            ['coption(array) rawType', argsWithRaw.coptionArrayU8],
        ])('should return true for %s', (_, arg) => {
            expect(isArrayArg(arg)).toBe(true);
        });
    });

    describe('non-array arguments', () => {
        it.each([
            ['simple string rawType', argsWithRaw.u64],
            ['vec rawType', argsWithRaw.vecU8],
            ['defined rawType', argsWithRaw.struct],
            ['option rawType', argsWithRaw.optionU64],
            ['coption rawType', argsWithRaw.coptionPubkey],
            ['option(vec) rawType', argsWithRaw.optionVecU8],
        ])('should return false for %s', (_, arg) => {
            expect(isArrayArg(arg)).toBe(false);
        });
    });

    describe('should parse argument with a fallback', () => {
        it.each([
            ['array(u8, 32)', args.arrayU8],
            ['array(bool, 3)', args.arrayBool3],
            ['array(publicKey, 2)', args.arrayPubkey2],
            ['option(array(bool, 3))', args.optionArrayBool3],
            ['coption(array(u8, 32))', args.coptionArrayU8],
        ])('should return true for %s', (_, arg) => {
            expect(isArrayArg(arg)).toBe(true);
        });

        it.each([
            ['simple types', args.u64],
            ['vector types', args.vecU8],
            ['option types', args.optionU64],
            ['types containing "array" but not as array(', args.myArrayType],
            ['empty string type', args.empty],
        ])('should return false for %s', (_, arg) => {
            expect(isArrayArg(arg)).toBe(false);
        });
    });
});

describe('isVectorArg', () => {
    describe('vector arguments', () => {
        it.each([
            ['vec rawType', argsWithRaw.vecU8],
            ['vec(publicKey) rawType', argsWithRaw.vecPubkey],
            ['option(vec) rawType', argsWithRaw.optionVecU8],
            ['coption(vec) rawType', argsWithRaw.coptionVecPubkey],
        ])('should return true for %s', (_, arg) => {
            expect(isVectorArg(arg)).toBe(true);
        });
    });

    describe('non-vector arguments', () => {
        it.each([
            ['simple string rawType', argsWithRaw.u64],
            ['array rawType', argsWithRaw.arrayU8],
            ['defined rawType', argsWithRaw.struct],
            ['option rawType', argsWithRaw.optionU64],
            ['coption rawType', argsWithRaw.coptionPubkey],
            ['option(array) rawType', argsWithRaw.optionArrayU8],
        ])('should return false for %s', (_, arg) => {
            expect(isVectorArg(arg)).toBe(false);
        });
    });

    describe('should parse argument with a fallback', () => {
        it.each([
            ['vec(u8)', args.vecU8],
            ['vec(publicKey)', args.vecPubkey],
            ['vec(string)', args.vecString],
            ['option(vec(u8))', args.optionVecU8],
            ['coption(vec(publicKey))', args.coptionVecPubkey],
            ['vec(RemainingAccountsSlice)', args.vecStruct],
        ])('should return true for %s', (_, arg) => {
            expect(isVectorArg(arg)).toBe(true);
        });

        it.each([
            ['simple types', args.u64],
            ['array types', args.arrayU8],
            ['option types', args.optionU64],
            ['types containing "vec" but not as vec(', args.myVectorType],
            ['empty string type', args.empty],
        ])('should return false for %s', (_, arg) => {
            expect(isVectorArg(arg)).toBe(false);
        });
    });
});

describe('getArrayLengthFromIdlType', () => {
    describe('array types with length', () => {
        it.each([
            ['u8, 32', { array: ['u8', 32] } as IdlType, 32],
            ['string, 2', { array: ['string', 2] } as IdlType, 2],
            ['bool, 3', { array: ['bool', 3] } as IdlType, 3],
            ['pubkey, 5', { array: ['pubkey', 5] } as IdlType, 5],
        ])('should return length for array(%s)', (_, type, expected) => {
            expect(getArrayLengthFromIdlType(type)).toBe(expected);
        });
    });

    describe('optional array types', () => {
        it.each([
            ['option(array)', { option: { array: ['u8', 16] } } as IdlType, 16],
            ['coption(array)', { coption: { array: ['string', 10] } } as IdlType, 10],
        ])('should return length for %s', (_, type, expected) => {
            expect(getArrayLengthFromIdlType(type)).toBe(expected);
        });
    });

    describe('types without length', () => {
        it.each([
            ['vector types', { vec: 'u8' } as IdlType],
            ['array with generic length', { array: ['u8', { generic: 'N' }] } as IdlType],
            ['simple types', 'u64' as IdlType],
            ['option of non-array', { option: 'u64' } as IdlType],
            ['coption of non-array', { coption: 'pubkey' } as IdlType],
            ['option(vec)', { option: { vec: 'u8' } } as IdlType],
            ['coption(vec)', { coption: { vec: 'u8' } } as IdlType],
        ])('should return undefined for %s', (_, type) => {
            expect(getArrayLengthFromIdlType(type)).toBeUndefined();
        });
    });

    describe('edge cases', () => {
        it.each([
            ['large array lengths', { array: ['u8', 1000] } as IdlType, 1000],
            ['single element arrays', { array: ['u8', 1] } as IdlType, 1],
        ])('should handle %s', (_, type, expected) => {
            expect(getArrayLengthFromIdlType(type)).toBe(expected);
        });

        it('should return undefined for defined types', () => {
            const type: IdlType = { defined: { generics: [], name: 'MyStruct' } };
            expect(getArrayLengthFromIdlType(type)).toBeUndefined();
        });
    });
});
