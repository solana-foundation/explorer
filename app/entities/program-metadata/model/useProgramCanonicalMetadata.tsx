'use client';

import { fetch } from 'cross-fetch';
import useSWRImmutable from 'swr/immutable';

import { Cluster } from '@/app/utils/cluster';
import Logger from '@/app/utils/logger';

import { getProgramCanonicalMetadata } from '../api/getProgramCanonicalMetadata';

/**
 * Check if the URL is a local RPC endpoint (localhost or 127.0.0.1)
 */
function isLocalRpcUrl(url: string): boolean {
    try {
        const { hostname } = new URL(url);
        return hostname === 'localhost' || hostname === '127.0.0.1';
    } catch {
        return false;
    }
}

/**
 * Check if the cluster should use direct client-side RPC fetching
 * instead of the API route (which only supports known public clusters)
 */
function shouldUseDirectRpc(cluster: Cluster, url: string): boolean {
    // Custom cluster always uses direct RPC
    if (cluster === Cluster.Custom) {
        return true;
    }
    // Also check if URL is localhost even for other clusters
    return isLocalRpcUrl(url);
}

export function useProgramCanonicalMetadata(
    programAddress: string,
    seed: string,
    url: string,
    cluster: Cluster,
    enabled: boolean,
    useSuspense = false
) {
    const { data } = useSWRImmutable(
        `program-metadata-${programAddress}-${url}-${seed}`,
        async () => {
            if (!enabled) {
                return null;
            }

            try {
                // For custom clusters or local RPC URLs, fetch directly from client
                // The API route doesn't support custom/local endpoints
                if (shouldUseDirectRpc(cluster, url)) {
                    return getProgramCanonicalMetadata(programAddress, seed, url);
                }

                // For known clusters, use the API route (benefits from caching)
                const response = await fetch(
                    `/api/programMetadataIdl?programAddress=${programAddress}&cluster=${cluster}&seed=${seed}`
                );
                if (response.ok) {
                    const data = await response.json();
                    const { details, programMetadata } = data;

                    // In case of 403, we have ok response but it contains {details: {error: string}} data
                    if (details?.error) {
                        Logger.error(new Error(details.error));
                        return null;
                    }

                    return programMetadata || null;
                }

                return null;
            } catch (error) {
                Logger.error(`Error fetching canonical metadata, seed ${seed}`, error);
                return null;
            }
        },
        { suspense: useSuspense }
    );
    return { programMetadata: data };
}
