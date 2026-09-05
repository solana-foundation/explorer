import type { SolanaRpc } from '@entities/cluster';
import { address as toAddress } from '@solana/kit';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchSignatures } from '../../api/get-signatures-for-address';
import { reconcile } from '../reconcile';
import type { HistoryRow } from '../types';

const sig = (signature: string) => ({ signature }) as unknown as HistoryRow;

describe('reconcile', () => {
    it('should ignore an empty refresh so a flaky RPC response cannot wipe loaded history or flip foundOldest', () => {
        const history = { fetched: [sig('a'), sig('b')], foundOldest: false };

        const result = reconcile(history, { append: false, history: { fetched: [], foundOldest: true } });

        expect(result).toBe(history);
    });

    it('should still record an empty result on the first load (a genuinely empty account)', () => {
        const result = reconcile(undefined, { append: false, history: { fetched: [], foundOldest: true } });

        expect(result?.fetched).toEqual([]);
        expect(result?.foundOldest).toBe(true);
    });

    it('should apply a non-empty refresh, prepending newly fetched signatures', () => {
        const history = { fetched: [sig('a')], foundOldest: false };

        const result = reconcile(history, {
            append: false,
            history: { fetched: [sig('b'), sig('a')], foundOldest: false },
        });

        expect(result?.fetched.map(s => s.signature)).toEqual(['b', 'a']);
    });

    it('should keep the end-of-history signal when load-more (append) returns empty', () => {
        const history = { fetched: [sig('a')], foundOldest: false };

        const result = reconcile(history, { append: true, history: { fetched: [], foundOldest: true } });

        expect(result?.fetched.map(s => s.signature)).toEqual(['a']);
        expect(result?.foundOldest).toBe(true);
    });
});

describe('fetchSignatures', () => {
    afterEach(() => vi.restoreAllMocks());

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

        const result = await fetchSignatures(rpc, ADDRESS, { limit: 25 });

        expect(result.map(s => s.signature)).toEqual(['a']);
        expect(getSignaturesForAddress).toHaveBeenCalledTimes(3);
    });

    it('should accept an empty first page only after the retries are exhausted', async () => {
        const { rpc, getSignaturesForAddress } = rpcReturning([], [], []);

        const result = await fetchSignatures(rpc, ADDRESS, { limit: 25 });

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
