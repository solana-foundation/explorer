'use client';

import { shouldUseDirectRpc } from '@entities/cluster/@x/program-metadata';
import useSWRImmutable from 'swr/immutable';

import { Logger } from '@/app/shared/lib/logger';
import { Cluster } from '@/app/utils/cluster';
import { isEnvEnabled } from '@/app/utils/env';

import { IDL_SEED } from '../api/constants';
import { resolvePmpContentClient } from '../api/resolve-pmp-content-client';

/**
 * The program's PMP IDL (`idl` seed). Known clusters read `idls.programMetadata` from the shared
 * `/api/idl-latest` route; custom/localhost resolves it directly via `@solana/idl` against the user's
 * RPC, with the fndn fallback authority so native-program IDLs surface. Gated by the PMP IDL feature
 * flag (client-side here; the route applies the same gate for the known-cluster path).
 */
export function useProgramMetadataIdl(programAddress: string, url: string, cluster: Cluster, useSuspense = false) {
    const enabled = isEnvEnabled(process.env.NEXT_PUBLIC_PMP_IDL_ENABLED);
    // Falsy key when disabled so the hook never fetches AND never writes the shared cache entry
    // (a disabled call writing under the same key would poison an enabled consumer's data).
    const swrKey = enabled && `pmp-idl-${programAddress}-${url}`;
    const { data, isLoading } = useSWRImmutable(
        swrKey,
        async () => {
            if (shouldUseDirectRpc(cluster, url)) {
                try {
                    return await resolvePmpContentClient({
                        programAddress,
                        seed: IDL_SEED,
                        url,
                        useFallbackAuthorities: true,
                    });
                } catch (error) {
                    Logger.error(new Error('[program-metadata] Error fetching PMP IDL', { cause: error }), {
                        programAddress,
                    });
                    return undefined;
                }
            }

            // Known clusters: the cached server route. We read the PMP IDL from the shared payload.
            const response = await fetch(`/api/idl-latest?programAddress=${programAddress}&cluster=${cluster}`);
            if (!response.ok) {
                // Throw (don't return) so a transient 502 is retried rather than cached as a
                // successful "no IDL" under useSWRImmutable (which never revalidates).
                throw new Error(`/api/idl-latest returned ${response.status}`);
            }
            const { idls } = await response.json();
            return idls?.programMetadata ?? undefined;
        },
        { errorRetryCount: 3, suspense: useSuspense },
    );
    return { isLoading, programMetadataIdl: enabled ? data : undefined };
}
