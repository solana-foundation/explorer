'use client';

import { shouldUseDirectRpc } from '@entities/cluster/@x/program-metadata';
import { fetchProgramIdls, resolveProgramIdlsClient } from '@entities/idl/@x/program-metadata';
import useSWRImmutable from 'swr/immutable';

import { Cluster } from '@/app/utils/cluster';
import { isEnvEnabled } from '@/app/utils/env';

/**
 * The program's PMP IDL (`idl` seed), projected from the shared idl-entity resolvers so the IDL card,
 * the transaction inspector, and this program-name label all read one resolution. Known clusters hit
 * the cached `/api/idl-latest` route; custom/localhost resolve client-side via `@solana/idl` —
 * PMP-only (`includeAnchor: false`, since the label never needs the Anchor leg), with the fndn
 * fallback authority so native-program IDLs surface. Gated by the PMP IDL feature flag (the route
 * applies the same gate for the known-cluster path).
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
                // Custom/localhost: the same client resolver the IDL card uses, PMP-only. It re-throws
                // transient RPC errors so SWR retries (errorRetryCount) — consistent with the route
                // path (the previous bespoke resolver swallowed blips, caching them as "no IDL").
                const { programMetadataIdl } = await resolveProgramIdlsClient({
                    includeAnchor: false,
                    includePmp: true,
                    programId: programAddress,
                    url,
                });
                return programMetadataIdl;
            }
            // Known clusters: read the PMP IDL from the shared, CDN-cached route payload.
            const { programMetadataIdl } = await fetchProgramIdls(programAddress, cluster);
            return programMetadataIdl;
        },
        { errorRetryCount: 3, suspense: useSuspense },
    );
    return { isLoading, programMetadataIdl: enabled ? data : undefined };
}
