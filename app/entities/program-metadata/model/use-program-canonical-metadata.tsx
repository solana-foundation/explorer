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
            try {
                // For custom clusters or local RPC URLs, fetch directly from client
                // The API route doesn't support custom/local endpoints
                if (shouldUseDirectRpc(cluster, url)) {
                    return await getProgramCanonicalMetadata(programAddress, seed, url);
                }

                // For known clusters, use the API route (benefits from caching)
                const response = await fetch(
                    `/api/program-metadata-idl?programAddress=${programAddress}&cluster=${cluster}&seed=${seed}`,
                );
                if (response.ok) {
                    const data = await response.json();
                    return data.programMetadata || null;
                }

                return null;
            } catch (error) {
                if (isAccountNotFoundError(error)) {
                    return null;
                }
                Logger.error(new Error('[program-metadata] Error fetching canonical metadata', { cause: error }), {
                    seed,
                });
                return null;
            }
        },
        { suspense: useSuspense },
    );
    // Preserve the historical contract: disabled → `null` (not `undefined`); enabled → SWR data
    // (`undefined` while loading, then the resolved value or `null`).
    return { isLoading, programMetadata: enabled ? data : null };
}
