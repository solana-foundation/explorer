import type { SolanaRpc } from '@entities/cluster';
import { address as toAddress } from '@solana/kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchSignatures } from '../get-signatures-for-address';

describe('fetchSignatures', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const ADDRESS = toAddress('11111111111111111111111111111111');

    // A kit getSignaturesForAddress row: slot and blockTime arrive as bigints.
    function rpcRow(signature: string, slot = 0n) {
        return { blockTime: null, confirmationStatus: null, err: null, memo: null, signature, slot };
    }

    function rpcReturning(...pages: unknown[][]) {
        const getSignaturesForAddress = vi.fn();
        pages.forEach(page => getSignaturesForAddress.mockReturnValueOnce({ send: () => Promise.resolve(page) }));
        return { getSignaturesForAddress, rpc: { getSignaturesForAddress } as unknown as SolanaRpc };
    }

    it('should retry an empty first page and return the signatures once a healthy replica responds', async () => {
        const { rpc, getSignaturesForAddress } = rpcReturning([], [], [rpcRow('a')]);

        const result = await runningTimers(fetchSignatures(rpc, ADDRESS, { limit: 25 }));

        expect(result.map(s => s.signature)).toEqual(['a']);
        expect(getSignaturesForAddress).toHaveBeenCalledTimes(3);
    });

    it('should accept an empty first page only after the retries are exhausted', async () => {
        const { rpc, getSignaturesForAddress } = rpcReturning([], [], []);

        const result = await runningTimers(fetchSignatures(rpc, ADDRESS, { limit: 25 }));

        expect(result).toEqual([]);
        expect(getSignaturesForAddress).toHaveBeenCalledTimes(3);
    });

    it('should not retry an empty page when paging (before set) — that is the real end of history', async () => {
        const { rpc, getSignaturesForAddress } = rpcReturning([]);

        const result = await fetchSignatures(rpc, ADDRESS, { before: 'zzz', limit: 25 });

        expect(result).toEqual([]);
        expect(getSignaturesForAddress).toHaveBeenCalledTimes(1);
    });

    // Kit upcasts every integer outside its allow-list to a bigint — slot, blockTime, and the
    // indices inside an err payload. Consumers JSON.stringify these rows and do arithmetic on
    // them, so a bigint that leaks through this mapping throws at render time.
    it('should map bigint slot, blockTime and err payloads back to numbers', async () => {
        const { rpc } = rpcReturning([
            {
                blockTime: 1_700_000_000n,
                confirmationStatus: 'finalized' as const,
                err: { InstructionError: [1n, { Custom: 42n }] },
                memo: 'hi',
                signature: 'failed-tx',
                slot: 123n,
                transactionIndex: 7,
            },
        ]);

        const [row] = await fetchSignatures(rpc, ADDRESS, { limit: 25 });

        expect(row).toEqual({
            blockTime: 1_700_000_000,
            confirmationStatus: 'finalized',
            err: { InstructionError: [1, { Custom: 42 }] },
            memo: 'hi',
            signature: 'failed-tx',
            slot: 123,
            transactionIndex: 7,
        });
        expect(() => JSON.stringify(row)).not.toThrow();
    });
});

async function runningTimers<T>(pending: Promise<T>): Promise<T> {
    await vi.runAllTimersAsync();
    return pending;
}
