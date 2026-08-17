import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

// Entity-internal imports, not the slice's own `index.ts`, which would be an import cycle.
import { Cluster, clusterSlug } from '../lib/cluster';
import { isCustomUrlCarryable } from '../lib/resolve-cluster';

// Structural, so callers can pass a `ReadonlyURLSearchParams`, a plain `URLSearchParams`, or a double.
type ParamsLike = { get(key: string): string | null; toString(): string };

type Config = Readonly<{
    additionalParams?: ParamsLike;
    pathname: string;
}>;

export function useClusterPath({ additionalParams, pathname }: Config) {
    const buildClusterPath = useBuildClusterPath();
    return useMemo(
        () => buildClusterPath(pathname, { additionalParams }),
        [additionalParams, buildClusterPath, pathname],
    );
}

// Builds a cluster-preserving path inside a callback or a loop, where a hook cannot run per item.
// Override `currentSearchParams` when the incoming params are not the URL bar's: search navigation
// parses them out of the target item's own pathname.
export function useBuildClusterPath() {
    const currentSearchParams = useSearchParams();
    return useCallback(
        (pathname: string, options?: { additionalParams?: ParamsLike; currentSearchParams?: ParamsLike }) => {
            const [pathnameWithoutHash, hash] = extractPathnameHash(pathname);
            const current = options?.currentSearchParams ?? currentSearchParams ?? undefined;
            return (
                pickClusterParams(pathnameWithoutHash, current, options?.additionalParams) + (hash ? `#${hash}` : '')
            );
        },
        [currentSearchParams],
    );
}

function extractPathnameHash(pathname: string) {
    const hashIndex = pathname.indexOf('#');
    const pathnameWithoutHash = hashIndex === -1 ? pathname : pathname.slice(0, hashIndex);
    const hash = hashIndex === -1 ? '' : pathname.slice(hashIndex + 1);

    return [pathnameWithoutHash, hash];
}

// Exported for direct testing. React callers should reach for the hooks above.
export function pickClusterParams(
    pathname: string,
    currentSearchParams?: ParamsLike,
    additionalParams?: { get(key: string): string | null },
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
                    if (
                        paramName === 'customUrl' &&
                        !mayCarryCustomUrl(currentSearchParams.get('cluster'), existingValue)
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
        // Decided from the merged result, not the incoming params: the branch above copies the current
        // params wholesale, and `additionalParams` can both add a `customUrl` and switch away from Custom.
        if (!mayCarryCustomUrl(params.get('cluster'), params.get('customUrl'))) {
            params.delete('customUrl');
        }
    }
    const queryString = nextSearchParams?.toString();
    return `${pathname}${queryString ? `?${queryString}` : ''}`;
}

// Whether a link may carry `customUrl`. Off the Custom cluster the param is inert — the reader strips it
// on arrival — and carrying it leaks the user's endpoint, which often embeds an API key. An absent or
// unrecognised slug means the default cluster, which is not Custom.
//
// Trust is deliberately absent, so this can never be *stricter* than the reader and drop the endpoint the
// page is using. Looser is required: an endpoint awaiting consent has to survive an in-app click.
function mayCarryCustomUrl(clusterMoniker: string | null, candidateUrl: string | null) {
    return clusterMoniker === CUSTOM_MONIKER && isCustomUrlCarryable(candidateUrl);
}

const MAINNET_MONIKER = clusterSlug(Cluster.MainnetBeta);
const CUSTOM_MONIKER = clusterSlug(Cluster.Custom);
