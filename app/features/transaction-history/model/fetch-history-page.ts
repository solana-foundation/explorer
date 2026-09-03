import type { Address } from '@solana/kit';

import { Logger } from '@/app/shared/lib/logger';

import { fetchViaSignatures } from '../api/get-signatures-for-address';
import { getTransactionsForAddress } from '../api/get-transactions-for-address';
import { isGtfaDisabled } from '../lib/gtfa-disabled-addresses';
import { hasActiveFilters, type HistoryFilters } from '../lib/history-filters';
import { isMethodNotFound } from '../lib/rpc-errors';
import type { AccountHistory } from '../lib/types';

export type HistoryPage = {
    history: AccountHistory;
    // True when getTransactionsForAddress claimed an empty page that getSignaturesForAddress
    // disproved. The caller latches the address so its remaining pages stay on the
    // signatures path — see below for why the cursors can't be mixed.
    signaturesOnly: boolean;
};

/**
 * Fetches one page of history, choosing between `getTransactionsForAddress` and
 * `getSignaturesForAddress`. This is the module's method-selection policy; the `api/`
 * layer owns the calls themselves.
 *
 * Throws any error the caller must surface. A method-not-found is handled internally
 * (reported via `onMethodNotFound`) and does not throw.
 */
export async function fetchHistoryPage({
    url,
    address,
    limit,
    // Trailing-signature cursor used only by the getSignaturesForAddress path.
    before,
    paginationToken,
    filters,
    // Skip getTransactionsForAddress because an earlier page already proved this endpoint's
    // index doesn't cover the address. The statically disabled addresses are handled below,
    // so this policy holds for every caller rather than only the one that remembers to check.
    forceSignatures = false,
    // Called when the endpoint reports getTransactionsForAddress as unavailable, so the
    // UI can disable filtering before the request falls back to getSignaturesForAddress.
    onMethodNotFound,
}: {
    url: string;
    address: Address;
    limit: number;
    before?: string;
    paginationToken?: string;
    filters: HistoryFilters;
    forceSignatures?: boolean;
    onMethodNotFound?: () => void;
}): Promise<HistoryPage> {
    // gTFA is disabled up front for a few hot addresses because it times out upstream. Unlike a
    // real method-not-found this is scoped to the address: onMethodNotFound is deliberately NOT
    // called, so filtering stays available for every other account in the session.
    if (forceSignatures || isGtfaDisabled(address)) {
        return { history: await fetchViaSignatures({ address, before, limit, url }), signaturesOnly: false };
    }

    let result;
    try {
        result = await getTransactionsForAddress({
            address,
            filters,
            limit,
            paginationToken,
            url,
        });
    } catch (error) {
        if (!isMethodNotFound(error)) throw error;
        // Endpoint doesn't implement getTransactionsForAddress: disable filtering
        // and fall back to the standard getSignaturesForAddress path.
        onMethodNotFound?.();
        return { history: await fetchViaSignatures({ address, before, limit, url }), signaturesOnly: false };
    }

    const history: AccountHistory = {
        fetched: result.data,
        // An absent paginationToken is the canonical end-of-stream signal; a short page
        // is not, since the server may still hand back a token for more.
        foundOldest: !result.paginationToken,
        paginationToken: result.paginationToken,
    };

    // An empty page that still hands back a cursor makes no end-of-history claim, so there is
    // nothing to confirm — but only on a continuation, where the rows already on screen keep
    // that cursor reachable. A zero-row *first* page is a dead end whatever the token says
    // (the caller can only Load More from existing rows), so it still gets confirmed below.
    if (result.data.length > 0 || (result.paginationToken && paginationToken)) {
        return { history, signaturesOnly: false };
    }

    // An empty getTransactionsForAddress page is not proof that the history ended. Some
    // endpoints back the method with a limited-retention index and answer HTTP 200 with
    // `data: []` for anything older than its floor — indistinguishable from a real
    // end-of-history, and cached as `foundOldest: true`. getSignaturesForAddress reads the
    // full ledger index, so it settles the question.
    //
    // Skip the check when a filter is active: getSignaturesForAddress can't honour filters,
    // so its rows would answer a different question than the one that was asked, and an
    // empty filtered page is a legitimate "no matches" answer anyway.
    if (hasActiveFilters(filters)) return { history, signaturesOnly: false };

    // This call only *verifies* an answer we already hold. If it fails (rate limit, dead
    // replica), keep the getTransactionsForAddress page rather than failing the whole request:
    // an empty account would otherwise render "Failed to fetch transaction history" instead of
    // an empty table. The unverified page may still be a false end-of-history, but that is the
    // pre-existing behaviour and a refresh re-runs the check.
    let confirmed;
    try {
        confirmed = await fetchViaSignatures({ address, before, limit, url });
    } catch (error) {
        Logger.warn('[transaction-history] getSignaturesForAddress confirmation failed', {
            address,
            error,
            url,
        });
        return { history, signaturesOnly: false };
    }

    if (confirmed.fetched.length === 0) return { history, signaturesOnly: false };

    // The ledger disagreed. Keep this address on the signatures path for its remaining
    // pages: the two methods use different cursors, and reverting to the paginationToken
    // (now absent) on the next Load More would re-request the head and make no progress.
    return { history: confirmed, signaturesOnly: true };
}
