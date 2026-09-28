import type { TransactionVersion } from '@solana/kit';
import { describe, expect, it } from 'vitest';

import type { BlockData } from '../../model/types';
import { summarizeBlockTransactionVersions } from '../transaction-versions';

function blockWithVersions(versions: TransactionVersion[], unavailable = 0): BlockData {
    return {
        transactions: [
            ...versions.map((version, index) => ({ index, message: { version } })),
            ...Array.from({ length: unavailable }, (_, offset) => ({
                index: versions.length + offset,
                unavailable: true,
            })),
        ],
    } as unknown as BlockData;
}

describe('summarizeBlockTransactionVersions', () => {
    it('should count each version and its share of the block', () => {
        const { entries, incomplete, total } = summarizeBlockTransactionVersions(
            blockWithVersions(['legacy', 0, 0, 1]),
        );

        expect(incomplete).toBe(false);
        expect(total).toEqual(4);
        expect(entries).toEqual([
            { count: 1, label: 'Legacy', share: 0.25, version: 'legacy' },
            { count: 2, label: 'v0', share: 0.5, version: 0 },
            { count: 1, label: 'v1', share: 0.25, version: 1 },
        ]);
    });

    it('should report every version for an empty block without dividing by zero', () => {
        const { entries, incomplete, total } = summarizeBlockTransactionVersions(blockWithVersions([]));

        expect(incomplete).toBe(false);
        expect(total).toEqual(0);
        expect(entries.map(entry => [entry.count, entry.share])).toEqual([
            [0, 0],
            [0, 0],
            [0, 0],
        ]);
    });

    it('should mark version counts as incomplete when a transaction is unavailable', () => {
        const { entries, incomplete, total } = summarizeBlockTransactionVersions(blockWithVersions(['legacy', 0], 1));

        expect(incomplete).toBe(true);
        expect(total).toBe(2);
        expect(entries.map(entry => entry.count)).toEqual([1, 1, 0]);
    });
});
