import { getRpc, type SolanaRpc } from '@entities/cluster';
import type { Address, Signature } from '@solana/kit';
import { withBackoff } from '@utils/with-backoff';

import { withNumbersInsteadOfBigInts } from '@/app/shared/lib/bigint-to-number';

import type { AccountHistory, HistoryRow } from '../lib/types';

// A lagging/cold RPC replica can return an empty signatures page for an account that actually has
// history — indistinguishable from a genuinely empty account, but far more likely on a busy one. The
// first page is the dangerous one: an empty result there is cached as `foundOldest: true` and rendered
// as "Fetched full history" until a manual reload. Wrap every attempt in withBackoff (parity with the
// transaction fetch), and retry a first-page empty a few times — each attempt is a fresh request,
// so a load balancer can route us to a healthy node — before trusting it as the real "no history" answer.
const EMPTY_FIRST_PAGE_RETRIES = 2;
const EMPTY_FIRST_PAGE_RETRY_DELAY_MS = 300;

// Element of kit's getSignaturesForAddress response, stated structurally so the mapping below
// documents what it relies on.
type RpcSignatureInfo = Readonly<{
    blockTime: bigint | null;
    confirmationStatus: 'confirmed' | 'finalized' | 'processed' | null;
    err: unknown;
    memo: string | null;
    signature: string;
    slot: bigint;
    transactionIndex?: number;
}>;

// Kit upcasts integers outside its allow-list to bigints: `slot`/`blockTime` arrive as bigints, and
// so does every index inside an `err` payload — which downstream consumers JSON.stringify and do
// arithmetic on. The recursive sweep brings every field back to the numeric HistoryRow shape at the
// boundary, so a field kit upcasts later cannot leak a bigint past it. `confirmationStatus` is the
// one shape difference left: the row contract wants undefined where the wire says null.
function toHistoryRow(item: RpcSignatureInfo): HistoryRow {
    return {
        ...(withNumbersInsteadOfBigInts(item) as unknown as HistoryRow),
        confirmationStatus: item.confirmationStatus ?? undefined,
    };
}

export async function fetchSignatures(
    rpc: SolanaRpc,
    address: Address,
    options: { before?: string; limit: number },
): Promise<HistoryRow[]> {
    const isFirstPage = options.before === undefined;
    const config = {
        // The cursor is a signature handed back by a previous page, so it is asserted-by-origin
        // rather than re-validated here.
        before: options.before as Signature | undefined,
        limit: options.limit,
    };
    for (let attempt = 0; ; attempt++) {
        const fetched = await withBackoff(() => rpc.getSignaturesForAddress(address, config).send());
        if (fetched.length > 0 || !isFirstPage || attempt >= EMPTY_FIRST_PAGE_RETRIES) {
            return fetched.map(toHistoryRow);
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
    address,
    limit,
    before,
}: {
    url: string;
    address: Address;
    limit: number;
    before?: string;
}): Promise<AccountHistory> {
    const fetched = await fetchSignatures(getRpc(url), address, { before, limit });
    // No paginationToken on this path: getSignaturesForAddress pages by trailing signature.
    return {
        fetched,
        foundOldest: fetched.length < limit,
    };
}
