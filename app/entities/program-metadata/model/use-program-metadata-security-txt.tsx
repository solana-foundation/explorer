'use client';

import { shouldUseDirectRpc } from '@entities/cluster/@x/program-metadata';
import useSWRImmutable from 'swr/immutable';

import { Logger } from '@/app/shared/lib/logger';
import { Cluster } from '@/app/utils/cluster';
import { isEnvEnabled } from '@/app/utils/env';

import { SECURITY_TXT_SEED } from '../api/constants';
import { resolvePmpContentClient } from '../api/resolve-pmp-content-client';

/**
 * The program's canonical security.txt (PMP `security` seed). Known clusters use the cached
 * `/api/security-txt` route; custom/localhost resolves directly via `@solana/idl` against the user's
 * RPC. Canonical authority only (no fndn fallback — that's IDL-specific). Gated by the security.txt
 * feature flag.
 */
export function useProgramMetadataSecurityTxt(
    programAddress: string,
    url: string,
    cluster: Cluster,
    useSuspense = false,
) {
    const enabled = isEnvEnabled(process.env.NEXT_PUBLIC_PMP_SECURITY_TXT_ENABLED);
    const swrKey = enabled && `pmp-security-${programAddress}-${url}`;
    const { data } = useSWRImmutable(
        swrKey,
        async () => {
            if (shouldUseDirectRpc(cluster, url)) {
                try {
                    return await resolvePmpContentClient({
                        programAddress,
                        seed: SECURITY_TXT_SEED,
                        url,
                        useFallbackAuthorities: false,
                    });
                } catch (error) {
                    Logger.error(new Error('[program-metadata] Error fetching security.txt', { cause: error }), {
                        programAddress,
                    });
                    return undefined;
                }
            }

            // Known clusters: the cached server route.
            const response = await fetch(`/api/security-txt?programAddress=${programAddress}&cluster=${cluster}`);
            if (!response.ok) {
                // Throw (don't return) so a transient 502 is retried rather than cached as a
                // successful "no security.txt" under useSWRImmutable (which never revalidates).
                throw new Error(`/api/security-txt returned ${response.status}`);
            }
            const data = await response.json();
            return data.programMetadata || undefined;
        },
        { errorRetryCount: 3, suspense: useSuspense },
    );
    return { programMetadataSecurityTxt: enabled ? data : undefined };
}
