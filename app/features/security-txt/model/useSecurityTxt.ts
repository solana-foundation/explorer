'use client';

import { shouldUseDirectRpc } from '@entities/cluster';
import useSWRImmutable from 'swr/immutable';

import { useCluster } from '@/app/providers/cluster';
import { type Cluster } from '@/app/utils/cluster';

import { fetchSecurityTxtClient, type ResolvedSecurityTxt } from '../api/load-fetch-security-txt';

export type { ResolvedSecurityTxt };

/**
 * Resolves a program's security.txt via `@solana/security-txt` — the PMP `security` seed (canonical
 * only) then the legacy Neodyme ELF section. Known clusters use the cached `/api/security-txt` route;
 * custom / localhost resolve in the browser via `fetchSecurityTxtClient`, whose `@solana/security-txt`
 * import is dynamic so the package stays out of the bundle for the common known-cluster path.
 */
export function useSecurityTxt(programAddress: string): {
    securityTxt: ResolvedSecurityTxt | undefined;
    isLoading: boolean;
} {
    const { url, cluster } = useCluster();
    const isCustom = shouldUseDirectRpc(cluster, url);

    const { data: serverData, isLoading: serverLoading } = useSWRImmutable(
        !isCustom && (['security-txt', programAddress, cluster] as const),
        () => fetchFromRoute(programAddress, cluster),
        // fetchFromRoute throws on failure (rather than caching an empty result), so cap the retries.
        { errorRetryCount: 3 },
    );

    const { data: customData, isLoading: customLoading } = useSWRImmutable(
        isCustom && (['security-txt-custom', programAddress, url] as const),
        () => fetchSecurityTxtClient({ programId: programAddress, url }),
        { errorRetryCount: 3 },
    );

    return isCustom
        ? { isLoading: customLoading, securityTxt: customData }
        : { isLoading: serverLoading, securityTxt: serverData };
}

async function fetchFromRoute(programAddress: string, cluster: Cluster): Promise<ResolvedSecurityTxt | undefined> {
    const response = await fetch(`/api/security-txt?programAddress=${programAddress}&cluster=${cluster}`);
    if (!response.ok) {
        // Throw (don't return) so a transient 502 is retried rather than cached as a successful
        // "no security.txt" under useSWRImmutable (which never revalidates).
        throw new Error(`/api/security-txt returned ${response.status}`);
    }
    const { securityTxt } = await response.json();
    return securityTxt ?? undefined;
}
