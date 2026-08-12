import { isCustomUrlAllowed } from '@entities/cluster/lib/resolve-cluster';
import { customUrlEnabledAtom } from '@entities/cluster/model/cluster-storage';
import { useAtomValue } from 'jotai';
import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import { Cluster, clusterFromSlug, clusterSlug, DEFAULT_CLUSTER } from './cluster';

// The read-only slice of URLSearchParams these helpers need. Kept structural so callers can pass a
// `ReadonlyURLSearchParams`, a plain `URLSearchParams`, or a test double.
type ParamsLike = { get(key: string): string | null; toString(): string };

type Config = Readonly<{
    additionalParams?: ParamsLike;
    pathname: string;
}>;

function extractPathnameHash(pathname: string) {
    const hashIndex = pathname.indexOf('#');
    const pathnameWithoutHash = hashIndex === -1 ? pathname : pathname.slice(0, hashIndex);
    const hash = hashIndex === -1 ? '' : pathname.slice(hashIndex + 1);

    return [pathnameWithoutHash, hash];
}

// Builds a cluster-preserving path, for callers that need one *inside* a callback or a loop — where a
// hook cannot run per item. This is the only place the navigation code reads the dev toggle, so the
// components that build links stay unaware that one exists.
//
// `currentSearchParams` defaults to the live URL. Override it when the incoming params are not the URL
// bar's: search navigation parses them out of the target item's own pathname.
export function useBuildClusterPath() {
    const currentSearchParams = useSearchParams();
    const devFlagEnabled = useAtomValue(customUrlEnabledAtom);
    return useCallback(
        (pathname: string, options?: { additionalParams?: ParamsLike; currentSearchParams?: ParamsLike }) => {
            const [pathnameWithoutHash, hash] = extractPathnameHash(pathname);
            const current = options?.currentSearchParams ?? currentSearchParams ?? undefined;
            return (
                pickClusterParams(pathnameWithoutHash, current, options?.additionalParams, devFlagEnabled) +
                (hash ? `#${hash}` : '')
            );
        },
        [currentSearchParams, devFlagEnabled],
    );
}

export function useClusterPath({ additionalParams, pathname }: Config) {
    const buildClusterPath = useBuildClusterPath();
    return useMemo(
        () => buildClusterPath(pathname, { additionalParams }),
        [additionalParams, buildClusterPath, pathname],
    );
}

const MAINNET_MONIKER = clusterSlug(Cluster.MainnetBeta);

// Whether a link may carry `customUrl`, decided by the same rule the reader uses (`isCustomUrlAllowed`
// via `useClusterUrl`). Keeping one criterion matters: a link builder that is stricter than the reader
// silently drops an endpoint the app would have honored — on the dev flag, or on a whitelisted host —
// so the first in-app click would fall back to the remembered URL.
//
// `clusterMoniker` is the slug as it will appear in the built URL, so `null` means the default cluster:
// `pickClusterParams` omits `cluster=mainnet-beta` because it is the default, not because it is absent.
function mayCarryCustomUrl(clusterMoniker: string | null, candidateUrl: string | null, devFlagEnabled: boolean) {
    if (!candidateUrl) return false;
    const cluster = clusterMoniker === null ? DEFAULT_CLUSTER : clusterFromSlug(clusterMoniker);
    if (cluster === undefined) return false;
    return isCustomUrlAllowed({ candidateUrl, cluster, devFlagEnabled });
}

// The pure primitive. React callers should reach for `useClusterPath` or `useBuildClusterPath` instead,
// which supply `devFlagEnabled` from the atom; this stays exported for direct, store-free testing.
export function pickClusterParams(
    pathname: string,
    currentSearchParams?: ParamsLike,
    additionalParams?: { get(key: string): string | null },
    // The persisted dev toggle (`customUrlEnabledAtom`), which honors `customUrl` on any cluster.
    // Defaults to `false` so a caller that omits it fails closed — it strips the endpoint rather than
    // propagating it.
    devFlagEnabled = false,
): string {
    let nextSearchParams: URLSearchParams | undefined;

    if (currentSearchParams && !!currentSearchParams.toString()) {
        if (additionalParams) {
            // When additionalParams provided, preserve ALL current params
            nextSearchParams = new URLSearchParams(currentSearchParams.toString());
        } else {
            // When no additionalParams, only pick cluster and customUrl
            ['cluster', 'customUrl'].forEach(paramName => {
                const existingValue = currentSearchParams.get(paramName);
                if (existingValue) {
                    // Skip mainnet-beta cluster as it's the default
                    if (paramName === 'cluster' && existingValue === MAINNET_MONIKER) {
                        return;
                    }
                    // Carrying a customUrl the app will not honor leaks the user's endpoint (these often
                    // embed an API key) into our server logs and into any shared link, for no functional
                    // gain. `mayCarryCustomUrl` decides; see its comment for why the rule is shared.
                    if (
                        paramName === 'customUrl' &&
                        !mayCarryCustomUrl(currentSearchParams.get('cluster'), existingValue, devFlagEnabled)
                    ) {
                        return;
                    }
                    nextSearchParams ||= new URLSearchParams();
                    nextSearchParams.set(paramName, existingValue);
                }
            });
        }
    }

    if (additionalParams) {
        nextSearchParams ||= new URLSearchParams();
        const params = nextSearchParams;
        const additionalParamsObj = new URLSearchParams(additionalParams.toString());
        additionalParamsObj.forEach((value, key) => {
            // Skip mainnet-beta cluster as it's the default
            if (key === 'cluster' && value === MAINNET_MONIKER) {
                // Remove it if it was added from current params
                params.delete('cluster');
                return;
            }
            params.set(key, value); // Override current with additional
        });
        // Same rule as above, re-applied after the merge: additionalParams can switch the cluster away
        // from custom (or supply a customUrl for a cluster that ignores it), so decide from the *merged*
        // cluster rather than the incoming one. Otherwise switching custom → devnet would carry the
        // user's endpoint along into the new URL.
        if (!mayCarryCustomUrl(params.get('cluster'), params.get('customUrl'), devFlagEnabled)) {
            params.delete('customUrl');
        }
    }
    const queryString = nextSearchParams?.toString();
    return `${pathname}${queryString ? `?${queryString}` : ''}`;
}
