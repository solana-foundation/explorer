import BN from 'bn.js';
import { bigint, coerce, unknown } from 'superstruct';

// @project-serum/serum decodes u64/u128 as BN; convert via decimal string — Number loses precision past 2^53.
export const BigIntFromString = coerce(bigint(), unknown(), (value): bigint => {
    if (typeof value === 'string' || typeof value === 'bigint') return BigInt(value);
    if (BN.isBN(value)) return BigInt(value.toString(10));
    throw new Error('invalid bigint');
});
