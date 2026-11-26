import { fetchTransactionDetails } from '@entities/transaction-data';
import { Cluster } from '@utils/cluster';

import { Logger } from '@/app/shared/lib/logger';
import { UPSTREAM_TIMEOUT_MS } from '@/app/shared/lib/timeouts';

import { getTransactionQueue } from '../lib/get-transaction-queue';
import { TaskSkippedError } from '../lib/rate-limited-queue';
import type { ParsedTransactionResult } from '../lib/types';

export async function fetchParsedTransactions({
    url,
    cluster,
    signatures,
    shouldRun,
    onSettled,
}: {
    url: string;
    cluster: Cluster;
    signatures: string[];
    shouldRun: () => boolean;
    onSettled: (signature: string, result: ParsedTransactionResult) => void;
}): Promise<void> {
    await Promise.all(
        signatures.map(async signature =>
            onSettled(signature, await fetchParsedTransaction({ cluster, shouldRun, signature, url })),
        ),
    );
}

async function fetchParsedTransaction({
    url,
    cluster,
    signature,
    shouldRun,
}: {
    url: string;
    cluster: Cluster;
    signature: string;
    shouldRun: () => boolean;
}): Promise<ParsedTransactionResult> {
    try {
        const transaction = await getTransactionQueue(url)(
            () => fetchTransactionDetails(url, signature, { abortSignal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) }),
            shouldRun,
        );
        return transaction ? { status: 'loaded', transaction } : { status: 'failed' };
    } catch (error) {
        if (error instanceof TaskSkippedError) return { status: 'skipped' };
        if (cluster !== Cluster.Custom) {
            Logger.error(error, { signature, url });
        }
        return { status: 'failed' };
    }
}
