import { describe, expect, it } from 'vitest';

import { getRequestedComputeUnits } from '../compute-units.js';
import {
    bpfInstruction,
    setComputeUnitLimit,
    transactionWithInstructions,
    transferInstruction,
    v1TransactionWithConfig,
    v1TransactionWithLimitAndInstructions,
} from './fixtures.js';

const CONTEXT = { cluster: 'mainnet-beta', epoch: 1000n } as const;

describe('getRequestedComputeUnits', () => {
    describe('Transaction v1', () => {
        it('should report the config limit as declared', () => {
            const transaction = v1TransactionWithConfig({ computeUnitLimit: 19 });

            expect(getRequestedComputeUnits(transaction, CONTEXT)).toEqual({ source: 'declared', value: 19 });
        });

        it('should fall back to zero when the config sets no limit', () => {
            const transaction = v1TransactionWithConfig(undefined);

            expect(getRequestedComputeUnits(transaction, CONTEXT)).toEqual({ source: 'fallback', value: 0 });
        });

        it('should cap the config limit at the runtime maximum', () => {
            const transaction = v1TransactionWithConfig({ computeUnitLimit: 5_000_000 });

            expect(getRequestedComputeUnits(transaction, CONTEXT)).toEqual({ source: 'declared', value: 1_400_000 });
        });

        it('should read the config limit and ignore SetComputeUnitLimit instructions', () => {
            const transaction = v1TransactionWithLimitAndInstructions(10_000, [setComputeUnitLimit(999_999)]);

            expect(getRequestedComputeUnits(transaction, CONTEXT)).toEqual({ source: 'declared', value: 10_000 });
        });
    });

    describe.each([
        ['legacy', 'legacy'],
        ['v0', 0],
    ] as const)('Transaction %s', (_label, version) => {
        it('should report the limit as declared when an instruction sets it', () => {
            const transaction = transactionWithInstructions(version, [
                setComputeUnitLimit(100_000),
                transferInstruction(),
            ]);

            expect(getRequestedComputeUnits(transaction, CONTEXT)).toEqual({ source: 'declared', value: 100_000 });
        });

        it('should use the first limit when two instructions set one', () => {
            const transaction = transactionWithInstructions(version, [
                setComputeUnitLimit(100_000),
                setComputeUnitLimit(200_000),
            ]);

            expect(getRequestedComputeUnits(transaction, CONTEXT)).toEqual({ source: 'declared', value: 100_000 });
        });

        it('should cap a declared limit at the runtime maximum', () => {
            const transaction = transactionWithInstructions(version, [
                setComputeUnitLimit(5_000_000),
                transferInstruction(),
            ]);

            expect(getRequestedComputeUnits(transaction, CONTEXT)).toEqual({ source: 'declared', value: 1_400_000 });
        });

        it('should sum the per-program reserves when no instruction sets a limit', () => {
            const transaction = transactionWithInstructions(version, [transferInstruction(), transferInstruction()]);

            expect(getRequestedComputeUnits(transaction, CONTEXT)).toEqual({ source: 'calculated', value: 6_000 });
        });

        it('should discard earlier reserves when a later instruction sets a limit', () => {
            const transaction = transactionWithInstructions(version, [
                transferInstruction(),
                setComputeUnitLimit(100_000),
            ]);

            expect(getRequestedComputeUnits(transaction, CONTEXT)).toEqual({ source: 'declared', value: 100_000 });
        });

        it('should cap the summed reserves at the runtime maximum', () => {
            const instructions = Array.from({ length: 10 }, () => bpfInstruction());

            expect(getRequestedComputeUnits(transactionWithInstructions(version, instructions), CONTEXT).value).toBe(
                1_400_000,
            );
        });

        it('should report zero when the transaction has no instructions', () => {
            expect(getRequestedComputeUnits(transactionWithInstructions(version, []), CONTEXT)).toEqual({
                source: 'calculated',
                value: 0,
            });
        });
    });
});
