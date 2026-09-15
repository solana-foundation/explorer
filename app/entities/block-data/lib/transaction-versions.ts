import type { TransactionVersion } from '@solana/kit';

import type { BlockTransaction } from '../model/types';

// One version's slice of a block: how many transactions carried it, and what fraction of the
// block they are. `share` is a fraction in [0, 1]; formatting it is the renderer's business.
export type BlockTransactionVersionEntry = {
    count: number;
    label: string;
    share: number;
    version: TransactionVersion;
};

// The summarizer reads nothing but each transaction's version, so it asks for nothing more: a
// caller cannot satisfy this with a fixture that skips a field the summarizer depends on.
export type VersionedBlockTransactions = {
    transactions: readonly Pick<BlockTransaction, 'version'>[];
};

export type BlockTransactionVersionSummary = {
    entries: BlockTransactionVersionEntry[];
    total: number;
};

const VERSION_LABELS: { label: string; version: TransactionVersion }[] = [
    { label: 'Legacy', version: 'legacy' },
    { label: 'v0', version: 0 },
    { label: 'v1', version: 1 },
];

// Counts the message versions in a block so the overview can show the mix rather than a bare
// transaction total. Every known version is returned, including the ones with no transactions, so
// the breakdown keeps a stable shape from block to block.
export function summarizeBlockTransactionVersions(block: VersionedBlockTransactions): BlockTransactionVersionSummary {
    const counts = new Map<TransactionVersion, number>();
    for (const tx of block.transactions) {
        counts.set(tx.version, (counts.get(tx.version) ?? 0) + 1);
    }

    const total = block.transactions.length;
    const entries = VERSION_LABELS.map(({ label, version }) => {
        const count = counts.get(version) ?? 0;
        return { count, label, share: total === 0 ? 0 : count / total, version };
    });

    return { entries, total };
}
