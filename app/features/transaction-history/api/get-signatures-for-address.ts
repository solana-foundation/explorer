import { Connection, PublicKey, TransactionSignature } from '@solana/web3.js';
import { withBackoff } from '@utils/with-backoff';

import type { AccountHistory, HistoryRow } from '../lib/types';

// A lagging/cold RPC replica can return an empty signatures page for an account that actually has
// history — indistinguishable from a genuinely empty account, but far more likely on a busy one. The
// first page is the dangerous one: an empty result there is cached as `foundOldest: true` and rendered
// as "Fetched full history" until a manual reload. Wrap every attempt in withBackoff (parity with the
// transaction fetch), and retry a first-page empty a few times — each attempt is a fresh request,
// so a load balancer can route us to a healthy node — before trusting it as the real "no history" answer.
const EMPTY_FIRST_PAGE_RETRIES = 2;
const EMPTY_FIRST_PAGE_RETRY_DELAY_MS = 300;

export async function fetchSignatures(
    connection: Connection,
    pubkey: PublicKey,
    options: { before?: TransactionSignature; limit: number },
): Promise<HistoryRow[]> {
    const isFirstPage = options.before === undefined;
    for (let attempt = 0; ; attempt++) {
        const fetched = await withBackoff(() => connection.getSignaturesForAddress(pubkey, options));
        if (fetched.length > 0 || !isFirstPage || attempt >= EMPTY_FIRST_PAGE_RETRIES) {
            return fetched;
        }
        await new Promise(resolve => setTimeout(resolve, EMPTY_FIRST_PAGE_RETRY_DELAY_MS));
    }
}

/**
 * Fetches one page via the standard `getSignaturesForAddress`, whose pagination cursor is
 * the trailing `before` signature rather than a paginationToken. Standard RPCs support none
 * of the filters, so slot, block time and status are all left unapplied here — the caller
 * decides whether that is acceptable for the query it is answering.
 */
export async function fetchViaSignatures({
    url,
    pubkey,
    limit,
    before,
}: {
    url: string;
    pubkey: PublicKey;
    limit: number;
    before?: string;
}): Promise<AccountHistory> {
    const connection = new Connection(url);
    const fetched = await fetchSignatures(connection, pubkey, { before, limit });
    // No paginationToken on this path: getSignaturesForAddress pages by trailing signature.
    return {
        fetched,
        foundOldest: fetched.length < limit,
    };
}
