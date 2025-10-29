'use client';

import { fetch } from 'cross-fetch';
import useSWRImmutable from 'swr/immutable';

import { Cluster } from '@/app/utils/cluster';
import Logger from '@/app/utils/logger';

import { getProgramCanonicalMetadata } from '../api/getProgramCanonicalMetadata';

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
                // Only attempt to fetch client side if the url is localhost or 127.0.0.1
                const { hostname } = new URL(url);
                if (hostname === 'localhost' || hostname === '127.0.0.1') {
                    return getProgramCanonicalMetadata(programAddress, seed, url);
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
