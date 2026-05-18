import { Connection, ParsedTransactionWithMeta } from '@solana/web3.js';
import { withBackoff } from '@utils/with-backoff';
import pLimit from 'p-limit';

// Module-level storage: `${url}:${signature}` -> tx
const cache = new Map<string, ParsedTransactionWithMeta | null>();
const limit = pLimit(1);

/**
 * Fetches a parsed transaction sequentially — requests are processed one at a time
 * to avoid rate-limit (429) errors. Results are cached by `${url}:${signature}`.
 */
export function fetchParsedTransactionSequential(
    signature: string,
    url: string,
): Promise<ParsedTransactionWithMeta | null> {
    const key = `${url}:${signature}`;
    const cached = cache.get(key);
    if (cached !== undefined) return Promise.resolve(cached);
    return limit(async () => {
        const hit = cache.get(key);
        if (hit !== undefined) return hit;
        const connection = new Connection(url);
        const tx = await withBackoff(() =>
            connection.getParsedTransaction(signature, {
                maxSupportedTransactionVersion: 0,
            }),
        );
        cache.set(key, tx);
        return tx;
    });
}
