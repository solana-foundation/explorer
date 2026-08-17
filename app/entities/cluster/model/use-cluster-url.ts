'use client';

import { useHydrated } from '@shared/lib/use-hydrated';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo } from 'react';

import { Cluster, type ClusterSelection, clusterUrl } from '../lib/cluster';
import { decideCustomUrl } from '../lib/resolve-cluster';
import { DEFAULT_RPC_ENDPOINT, type RpcEndpoint } from '../lib/rpc-endpoint';
import { approvedOriginsAtom } from './approved-origins';
import { customUrlEnabledAtom } from './custom-url-enabled';

type UseClusterUrlParams = {
    cluster: Cluster;
    searchParams: URLSearchParams | null;
    onReplaceSearchParams: (next: URLSearchParams) => void;
};

// Resolves the RPC endpoint for the active cluster. The Custom cluster takes its endpoint from the
// `customUrl` query param, but only once `decideCustomUrl` says the user agreed to that endpoint: the
// query string is the only source for *which* endpoint, which keeps a custom cluster shareable, but
// anyone can write a link, so it is not evidence of consent.
//
// The caller must not connect to `url` while `pendingCustomUrl` is set or `customUrlDecided` is false.
// In both cases `url` is the fallback endpoint, not an answer.
export function useClusterUrl({ cluster, searchParams, onReplaceSearchParams }: UseClusterUrlParams): {
    customUrlDecided: boolean;
    pendingCustomUrl?: RpcEndpoint;
    selection: ClusterSelection;
    url: string;
} {
    const devFlagEnabled = useAtomValue(customUrlEnabledAtom);
    const approvedOrigins = useAtomValue(approvedOriginsAtom);
    // Both inputs force this gate: each reads storage on init, so either can be set here while the server
    // rendered it empty — the developer bypass from `localStorage`, the approvals from `sessionStorage`.
    // The hydrating render has to judge the param on what the server had, or it resolves an endpoint the
    // server's markup does not contain and React throws the tree away.
    //
    // Waiting is safe because both inputs only *widen* what is allowed — `pending` to `honored`, never the
    // reverse. Anything a reader can check for itself is still decided in the server render.
    const hydrated = useHydrated();

    // `|| undefined` so an empty `?customUrl=` counts as absent (and is stripped below) rather than as a
    // candidate URL.
    const paramCustomUrl = searchParams?.get('customUrl') || undefined;

    // The param is inert off the Custom cluster, and judging it there would prompt for an endpoint
    // nothing could use. The cluster decides *relevance* here, never trust — a link sets the cluster.
    const relevant = cluster === Cluster.Custom;
    // Memoised on the primitive inputs, so one endpoint string yields one `RpcEndpoint`. Consumers key
    // their own memos on this value, so a fresh object per render would churn all of them.
    const decision = useMemo(
        () =>
            relevant && paramCustomUrl !== undefined
                ? decideCustomUrl({
                      approvedOrigins: hydrated ? approvedOrigins : NONE_APPROVED,
                      candidateUrl: paramCustomUrl,
                      devFlagEnabled: hydrated && devFlagEnabled,
                  })
                : undefined,
        [approvedOrigins, devFlagEnabled, hydrated, paramCustomUrl, relevant],
    );

    // Before hydration every unapproved endpoint looks pending, including ones the developer bypass is
    // about to honor. Prompting there would open the consent modal on every page load and close it a
    // render later. Only `pending` needs the gate; `honored` and `refused` are already final.
    const customUrlDecided = hydrated || decision?.kind !== 'pending';
    const pendingCustomUrl = customUrlDecided && decision?.kind === 'pending' ? decision.endpoint : undefined;

    // Memoised for the same reason as the decision: consumers key effects and callbacks on this object.
    const selection = useMemo<ClusterSelection>(
        () =>
            cluster === Cluster.Custom
                ? { cluster, endpoint: decision?.kind === 'honored' ? decision.endpoint : DEFAULT_RPC_ENDPOINT }
                : { cluster },
        [cluster, decision],
    );

    // Drop any param the app has finished with: unusable, empty, or on a cluster that ignores it. Phrased
    // as "not one of the two we keep", so a param with no decision at all cannot slip through.
    //
    // No hydration gate needed: the two outcomes hydration can still change — `pending` now, `honored`
    // after — both keep the param.
    const keepParam = decision?.kind === 'honored' || decision?.kind === 'pending';
    const strip = searchParams?.has('customUrl') === true && !keepParam;
    useEffect(() => {
        if (!strip || !searchParams) return;
        const nextSearchParams = new URLSearchParams(searchParams.toString());
        nextSearchParams.delete('customUrl');
        onReplaceSearchParams(nextSearchParams);
    }, [strip, searchParams, onReplaceSearchParams]);

    return { customUrlDecided, pendingCustomUrl, selection, url: clusterUrl(selection) };
}

// Stable empty list, so the memo above does not see a new array on every render.
const NONE_APPROVED: readonly string[] = [];
