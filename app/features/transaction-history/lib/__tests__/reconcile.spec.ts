import { describe, expect, it } from 'vitest';

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
