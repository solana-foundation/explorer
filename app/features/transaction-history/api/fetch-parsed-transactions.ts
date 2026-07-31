import { Connection, ParsedTransactionWithMeta } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { fetchAll } from '@utils/fetch-all';
import { withBackoff } from '@utils/with-backoff';

import { Logger } from '@/app/shared/lib/logger';

import type { FailedTransactionSignatures, TransactionMap } from '../lib/types';

/**
 * Fetches full parsed transactions for a set of signatures. Individual failures are
 * collected rather than thrown, so one bad signature cannot fail the whole page.
 */
export async function fetchParsedTransactions({
    url,
    cluster,
    signatures,
}: {
    url: string;
    cluster: Cluster;
    signatures: string[];
}): Promise<{ transactionMap: TransactionMap; failedTransactionSignatures: FailedTransactionSignatures }> {
    const connection = new Connection(url);
    const results = await fetchAll(signatures, async signature => {
        try {
            const transaction = await withBackoff(() =>
                connection.getParsedTransaction(signature, {
                    maxSupportedTransactionVersion: 0,
                }),
            );

            return { signature, transaction };
        } catch (error) {
            if (cluster !== Cluster.Custom) {
                Logger.error(error, { signature, url });
            }
            return { signature, transaction: undefined };
        }
    });

    const transactionMap = new Map<string, ParsedTransactionWithMeta>();
    const failedTransactionSignatures = new Set<string>();

    results.forEach(({ signature, transaction }) => {
        if (transaction) {
            transactionMap.set(signature, transaction);
        } else {
            failedTransactionSignatures.add(signature);
        }
    });

    return { failedTransactionSignatures, transactionMap };
}
