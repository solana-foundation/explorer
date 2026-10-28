import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { codamaAccountRows, toPlainValue } from '../decoded-account-rows';

describe('toPlainValue', () => {
    it('should convert a BN to a bigint', () => {
        expect(toPlainValue(new BN(42))).toBe(42n);
    });

    it('should convert a PublicKey to its base58 string', () => {
        const key = new PublicKey('devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH');
        expect(toPlainValue(key)).toBe(key.toBase58());
    });

    it('should convert a Uint8Array to a plain number array', () => {
        expect(toPlainValue(new Uint8Array([1, 2, 3]))).toEqual([1, 2, 3]);
    });

    it('should recurse into arrays and nested objects', () => {
        const key = new PublicKey('devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH');
        const result = toPlainValue({
            count: new BN(7),
            owners: [key],
            settings: { enabled: true, limit: new BN(100) },
        });

        expect(result).toEqual({
            count: 7n,
            owners: [key.toBase58()],
            settings: { enabled: true, limit: 100n },
        });
    });

    it('should pass null and undefined through unchanged', () => {
        expect(toPlainValue(null)).toBeNull();
        expect(toPlainValue(undefined)).toBeUndefined();
    });
});

describe('codamaAccountRows', () => {
    it('should surface the selected enum variant so two variants with the same fields differ', () => {
        const deposit = codamaAccountRows({ action: { __kind: 'Deposit', value: 2n } });
        const withdraw = codamaAccountRows({ action: { __kind: 'Withdraw', value: 2n } });

        expect(deposit.map(row => row.label)).toEqual(['action', 'action.value']);
        expect(deposit[0].value).toBe('Deposit');
        expect(withdraw[0].value).toBe('Withdraw');
        expect(deposit).not.toEqual(withdraw);
    });
});
