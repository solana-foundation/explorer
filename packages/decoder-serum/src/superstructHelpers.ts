import { bigint, coerce, string } from 'superstruct';

export const BigIntFromString = coerce(bigint(), string(), (value): bigint => {
    if (typeof value === 'string') return BigInt(value);
    throw new Error('invalid bigint');
});
