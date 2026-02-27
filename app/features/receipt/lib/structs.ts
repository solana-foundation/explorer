import { PublicKey } from '@solana/web3.js';
import { coerce, instance, string, union } from 'superstruct';

/**
 * Superstruct type that accepts either a string or PublicKey and coerces to string.
 * Useful for validating parsed transaction data where addresses may come as PublicKey objects.
 */
export const publicKeyString = () =>
    coerce(string(), union([string(), instance(PublicKey)]), value =>
        typeof value === 'string' ? value : value.toString()
    );
