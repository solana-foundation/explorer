import { describe, expect, it } from 'vitest';

import type { BlockTransaction, BlockWithV1 } from '../../model/types';
import { summarizeBlockTransactionVersions } from '../transaction-versions';

function blockWithVersions(versions: BlockTransaction['version'][]): BlockWithV1 {
    return { transactions: versions.map(version => ({ version })) } as BlockWithV1;
}

describe('summarizeBlockTransactionVersions', () => {
    it('should count each version and its share of the block', () => {
        const { entries, total } = summarizeBlockTransactionVersions(blockWithVersions(['legacy', 0, 0, 1]));

        expect(total).toEqual(4);
        expect(entries).toEqual([
            { count: 1, label: 'Legacy', share: 0.25, version: 'legacy' },
            { count: 2, label: 'v0', share: 0.5, version: 0 },
            { count: 1, label: 'v1', share: 0.25, version: 1 },
        ]);
    });

    it('should report every version for an empty block without dividing by zero', () => {
        const { entries, total } = summarizeBlockTransactionVersions(blockWithVersions([]));

        expect(total).toEqual(0);
        expect(entries.map(entry => [entry.count, entry.share])).toEqual([
            [0, 0],
            [0, 0],
            [0, 0],
        ]);
    });
});
