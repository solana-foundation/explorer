import { describe, expect, it } from 'vitest';

import { gen } from '../../__tests__/gen.js';
import { derivePriorityFeeLamports, resolvePriorityFeeLamports } from '../fees.js';
import type { ParsedTransaction, TransactionConfig } from '../types.js';

function v1TransactionWithConfig(config: TransactionConfig | undefined): ParsedTransaction {
    return {
        accounts: [],
        instructions: [],
        numSignerAccounts: 1,
        lifetimeSpecifier: gen.blockhash(7),
        signatures: [],
        version: 1,
        ...(config && { config }),
    };
}

function legacyTransactionWithSigners(count: number): ParsedTransaction {
    return {
        accounts: [],
        instructions: [],
        numSignerAccounts: count,
        lifetimeSpecifier: gen.blockhash(7),
        signatures: [],
        version: 'legacy',
    };
}

describe('derivePriorityFeeLamports', () => {
    it('should subtract the per-signature base fee from the total', () => {
        expect(derivePriorityFeeLamports({ feeLamports: 15_000n, signatureCount: 1 })).toEqual(10_000n);
        expect(derivePriorityFeeLamports({ feeLamports: 15_000n, signatureCount: 2 })).toEqual(5_000n);
    });

    it('should report no priority fee for a transaction that paid only the base fee', () => {
        expect(derivePriorityFeeLamports({ feeLamports: 5_000n, signatureCount: 1 })).toEqual(0n);
        expect(derivePriorityFeeLamports({ feeLamports: 10_000n, signatureCount: 2 })).toEqual(0n);
    });

    it('should floor at zero rather than report a negative priority fee', () => {
        expect(derivePriorityFeeLamports({ feeLamports: 5_000n, signatureCount: 3 })).toEqual(0n);
    });
});

describe('resolvePriorityFeeLamports', () => {
    it('should return the total from v1 transaction', () => {
        const transaction = v1TransactionWithConfig({ priorityFeeLamports: 24n });

        expect(resolvePriorityFeeLamports(transaction, { feeLamports: 9_999n })).toBe(24n);
    });

    it('should return a u64 maximum v1 fee without losing precision', () => {
        const transaction = v1TransactionWithConfig({ priorityFeeLamports: 18_446_744_073_709_551_615n });

        expect(resolvePriorityFeeLamports(transaction, { feeLamports: undefined })).toBe(18_446_744_073_709_551_615n);
    });

    it('should return zero for a v1 transaction with no declared fee', () => {
        const transaction = v1TransactionWithConfig(undefined);

        expect(resolvePriorityFeeLamports(transaction, { feeLamports: 8_000n })).toBe(0n);
    });

    it('should return zero for a v1 transaction that declares a zero fee', () => {
        const transaction = v1TransactionWithConfig({ priorityFeeLamports: 0n });

        expect(resolvePriorityFeeLamports(transaction, { feeLamports: 8_000n })).toBe(0n);
    });

    it('should subtract the base fee from a legacy total', () => {
        const transaction = legacyTransactionWithSigners(1);

        expect(resolvePriorityFeeLamports(transaction, { feeLamports: 7_000n })).toBe(2_000n);
    });

    it('should never report a negative fee', () => {
        const transaction = legacyTransactionWithSigners(2);

        expect(resolvePriorityFeeLamports(transaction, { feeLamports: 5_000n })).toBe(0n);
    });

    it('should return undefined when the fee is unknown', () => {
        const transaction = legacyTransactionWithSigners(1);

        expect(resolvePriorityFeeLamports(transaction, { feeLamports: undefined })).toBeUndefined();
    });
});
