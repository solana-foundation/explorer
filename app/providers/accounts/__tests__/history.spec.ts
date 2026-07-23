import { ConfirmedSignatureInfo, Connection, PublicKey } from '@solana/web3.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchSignatures, reconcile } from '../history';

const sig = (signature: string) => ({ signature }) as unknown as ConfirmedSignatureInfo;

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

    const pubkey = PublicKey.default;

    function connectionReturning(...pages: ConfirmedSignatureInfo[][]) {
        const getSignaturesForAddress = vi.fn();
        pages.forEach(page => getSignaturesForAddress.mockResolvedValueOnce(page));
        return { connection: { getSignaturesForAddress } as unknown as Connection, getSignaturesForAddress };
    }

    it('should retry an empty first page and return the signatures once a healthy replica responds', async () => {
        const { connection, getSignaturesForAddress } = connectionReturning([], [], [sig('a')]);

        const result = await fetchSignatures(connection, pubkey, { limit: 25 });

        expect(result.map(s => s.signature)).toEqual(['a']);
        expect(getSignaturesForAddress).toHaveBeenCalledTimes(3);
    });

    it('should accept an empty first page only after the retries are exhausted', async () => {
        const { connection, getSignaturesForAddress } = connectionReturning([], [], []);

        const result = await fetchSignatures(connection, pubkey, { limit: 25 });

        expect(result).toEqual([]);
        expect(getSignaturesForAddress).toHaveBeenCalledTimes(3);
    });

    it('should not retry an empty page when paging (before set) — that is the real end of history', async () => {
        const { connection, getSignaturesForAddress } = connectionReturning([]);

        const result = await fetchSignatures(connection, pubkey, { before: 'zzz', limit: 25 });

        expect(result).toEqual([]);
        expect(getSignaturesForAddress).toHaveBeenCalledTimes(1);
    });
});
