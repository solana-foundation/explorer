import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

import { Cluster, clusterSlug } from './cluster';

type Config = Readonly<{
    additionalParams?: { get(key: string): string | null; toString(): string };
    pathname: string;
}>;

function extractPathnameHash(pathname: string) {
    const hashIndex = pathname.indexOf('#');
    const pathnameWithoutHash = hashIndex === -1 ? pathname : pathname.slice(0, hashIndex);
    const hash = hashIndex === -1 ? '' : pathname.slice(hashIndex + 1);

    return [pathnameWithoutHash, hash];
}

export function useClusterPath({ additionalParams, pathname }: Config) {
    const currentSearchParams = useSearchParams();
    const [pathnameWithoutHash, hash] = extractPathnameHash(pathname);
    return useMemo(
        () =>
            pickClusterParams(pathnameWithoutHash, currentSearchParams ?? undefined, additionalParams) +
            (hash ? `#${hash}` : ''),
        [additionalParams, currentSearchParams, hash, pathnameWithoutHash]
    );
}

const MAINNET_MONIKER = clusterSlug(Cluster.MainnetBeta);
export function pickClusterParams(
    pathname: string,
    currentSearchParams?: { toString(): string; get(key: string): string | null },
    additionalParams?: { get(key: string): string | null }
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
                    nextSearchParams ||= new URLSearchParams();
                    nextSearchParams.set(paramName, existingValue);
                }
            });
        }
    }

    if (additionalParams) {
        nextSearchParams ||= new URLSearchParams();
        const additionalParamsObj = new URLSearchParams(additionalParams.toString());
        additionalParamsObj.forEach((value, key) => {
            // Skip mainnet-beta cluster as it's the default
            if (key === 'cluster' && value === MAINNET_MONIKER) {
                // Remove it if it was added from current params
                nextSearchParams!.delete('cluster');
                return;
            }
            nextSearchParams!.set(key, value); // Override current with additional
        });
    }
    const queryString = nextSearchParams?.toString();
    return `${pathname}${queryString ? `?${queryString}` : ''}`;
}
