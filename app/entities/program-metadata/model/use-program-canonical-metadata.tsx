'use client';

import { shouldUseDirectRpc } from '@entities/cluster/@x/program-metadata';
import { isSolanaError, SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND } from '@solana/kit';
import { fetch } from 'cross-fetch';
import useSWRImmutable from 'swr/immutable';

import { Logger } from '@/app/shared/lib/logger';
import { Cluster } from '@/app/utils/cluster';

import { getProgramCanonicalMetadata } from '../api/getProgramCanonicalMetadata';

// Most programs don't publish canonical metadata, so a missing account is the expected outcome —
// the API route filters the same code (see app/api/program-metadata-idl/route.ts).
function isAccountNotFoundError(error: unknown): boolean {
    return isSolanaError(error, SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND);
}

export function useProgramCanonicalMetadata(
    programAddress: string,
    seed: string,
    url: string,
    cluster: Cluster,
    enabled: boolean,
    useSuspense = false,
) {
    // Pass a falsy key when disabled so the hook never fetches AND never writes to the shared
    // `program-metadata-${addr}-${url}-${seed}` cache entry. A disabled call writing `null` under
    // the same key as an enabled consumer (same program + url + seed) would poison it under
    // useSWRImmutable (which never revalidates) and starve that consumer of its data.
    const swrKey = enabled ? `program-metadata-${programAddress}-${url}-${seed}` : null;
    const { data, isLoading } = useSWRImmutable(
        swrKey,
        async () => {
            // For custom clusters or local RPC URLs, fetch directly from client
            // The API route doesn't support custom/local endpoints
            if (shouldUseDirectRpc(cluster, url)) {
                try {
                    return await getProgramCanonicalMetadata(programAddress, seed, url);
                } catch (error) {
                    if (isAccountNotFoundError(error)) {
                        return null;
                    }
                    Logger.error(new Error('[program-metadata] Error fetching canonical metadata', { cause: error }), {
                        seed,
                    });
                    return null;
                }
            }

            // For known clusters, use the API route (benefits from caching)
            const response = await fetch(
                `/api/program-metadata-idl?programAddress=${programAddress}&cluster=${cluster}&seed=${seed}`,
            );
            if (!response.ok) {
                // Throw instead of returning null: under useSWRImmutable a returned value (including
                // null) is cached as a successful "no metadata" result and never revalidated, so a
                // transient 502 from the route would permanently suppress metadata for the session.
                // Throwing lets SWR treat it as an error and retry (see errorRetryCount).
                throw new Error(`/api/program-metadata-idl returned ${response.status}`);
            }
            const data = await response.json();
            return data.programMetadata || null;
        },
        { errorRetryCount: 3, suspense: useSuspense },
    );
    // Preserve the historical contract: disabled → `null` (not `undefined`); enabled → SWR data
    // (`undefined` while loading or on a persistently failing API route, then the resolved value
    // or `null`).
    return { isLoading, programMetadata: enabled ? data : null };
}
