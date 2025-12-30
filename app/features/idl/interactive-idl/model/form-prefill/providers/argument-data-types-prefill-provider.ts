import { IdlType } from '@coral-xyz/anchor/dist/cjs/idl';
import { PublicKey } from '@solana/web3.js';

import { ArgumentType } from '../types';

/* eslint-disable sort-keys-fix/sort-keys-fix */
const DEFAULT_VALUES_PER_TYPE: Record<ArgumentType, string> = {
    bool: 'false',
    u8: '1',
    u16: '1',
    u32: '1',
    u64: '1',
    u128: '1',
    u256: '1',
    i8: '1',
    i16: '1',
    i32: '1',
    i64: '1',
    i128: '1',
    i256: '1',
    f32: '1.0',
    f64: '1.0',
    string: 'default',
    bytes: 'data',
    pubkey: PublicKey.default.toString(),
} as const;
/* eslint-enable sort-keys-fix/sort-keys-fix */

export function findDefaultValueForArgumentType(argType: IdlType | string): string {
    if (typeof argType === 'string') {
        return DEFAULT_VALUES_PER_TYPE[argType as ArgumentType] || '';
    }
    if ('vec' in argType) {
        return findDefaultValueForArgumentType(argType.vec);
    }
    if ('option' in argType) {
        return findDefaultValueForArgumentType(argType.option);
    }
    if ('coption' in argType) {
        return findDefaultValueForArgumentType(argType.coption);
    }
    if ('array' in argType) {
        return findDefaultValueForArgumentType(argType.array[0]);
    }
    return '';
}
