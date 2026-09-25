import { type ProgramIdlNames, resolveProgramIdlNames } from '@entities/idl/server';
import { matchAbortError } from '@shared/lib/errors';
import { type ServerCluster, serverClusterUrl } from '@utils/cluster';
import { settleWithin } from '@utils/settle-within';
import { type BackoffOptions } from '@utils/with-backoff';

import { Logger } from '@/app/shared/lib/logger';
import { isBlockedRequestError, withOnChainFetch } from '@/app/shared/lib/on-chain-fetch';

// One retry to keep an OG image render fast.
const IDL_BACKOFF_OPTIONS: BackoffOptions = { initialDelay: 200, maxRetries: 1 };

// Slack gives an unfurl 3s end to end, and this stage shares that budget with the cluster probe, the
// transaction fetch and the Satori render. Half of it is the most the IDL stage can take and still leave
// room for the rest, so a stalled RPC costs its program a name rather than costing the image.
const IDL_FETCH_BUDGET_MS = 1_500;

/**
 * IDL-derived names for a set of programs, keyed by program id. An absent key means no IDL named that
 * program - whether it has none, is a builtin, its resolution failed after the entity's retry, or it ran
 * past the budget.
 *
 * Never throws: an unnamed row is the same row either way, so a failure here costs names, not an image.
 * @param cluster - The cluster to resolve against, already decided by `getTxShareData`
 * @param programIds - The programs worth an IDL fetch. Duplicates are fine, they cost one resolution
 */
export async function getIdlNames({
    cluster,
    programIds,
}: {
    cluster: ServerCluster;
    programIds: readonly string[];
}): Promise<Map<string, ProgramIdlNames>> {
    const url = serverClusterUrl(cluster);
    // Deduped, so eight instructions from one program cost one resolution.
    const resolvable = [...new Set(programIds)];
    // `settleWithin` stops awaiting at the budget but cannot cancel, so this carries the same deadline
    // down to the RPC. Own controller rather than `AbortSignal.timeout`: one timer for the stage, fired at
    // the moment the budget lapses, and an `AbortError` the catch below can tell apart from a real fault.
    const abortController = new AbortController();

    try {
        // Scope `fetch` to the cluster RPC only: the IDL resolver can follow an off-chain URL planted in a
        // program's on-chain metadata, so an unguarded fetch here would be an SSRF vector on this
        // unauthenticated route. See `withOnChainFetch`.
        const settled = await withOnChainFetch([url], () =>
            settleWithin(
                IDL_FETCH_BUDGET_MS,
                resolvable.map(programId =>
                    resolveProgramEntry({ abortSignal: abortController.signal, cluster, programId, url }),
                ),
            ),
        );

        return new Map(settled.flatMap(entry => (entry ? [entry] : [])));
    } finally {
        // Anything unsettled here has outlived the budget: aborting frees its connection instead of
        // leaving the request, and the retry behind it, running after the image has been rendered.
        abortController.abort();
    }
}

/** One program's names as a map entry, or undefined when nothing named it and when the resolution failed. */
async function resolveProgramEntry({
    abortSignal,
    cluster,
    programId,
    url,
}: {
    abortSignal: AbortSignal;
    cluster: ServerCluster;
    programId: string;
    url: string;
}): Promise<[string, ProgramIdlNames] | undefined> {
    try {
        const resolved = await resolveProgramIdlNames(url, programId, { ...IDL_BACKOFF_OPTIONS, abortSignal });
        return resolved ? [programId, resolved] : undefined;
    } catch (error) {
        // A program dropped by the budget is the documented outcome above, not a fault: reporting it at
        // error level would file one alert per slow program on every render.
        if (matchAbortError(error)) {
            Logger.debug('[transaction-share] IDL names abandoned past the budget', { cluster, programId });
            return undefined;
        }
        // An off-chain IDL URL we refuse to fetch server-side (SSRF guard): expected and stable, not a fault.
        if (isBlockedRequestError(error)) {
            Logger.debug('[transaction-share] IDL name skipped: off-chain URL blocked by SSRF guard', {
                cluster,
                programId,
            });
            return undefined;
        }
        Logger.error(new Error('[transaction-share] IDL names unavailable for this program', { cause: error }), {
            cluster,
            programId,
        });
        return undefined;
    }
}
