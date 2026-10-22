'use client';

import { shouldUseDirectRpc } from '@entities/cluster/@x/idl';
import { useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';

import { type Cluster } from '@/app/utils/cluster';

import { fetchProgramIdls } from '../api/fetch-program-idls';
import { resolveProgramIdlsClient } from '../api/load-resolve-program-idls';
import { getOnChainIdls, type SourcedIdl } from './sourced-idl';

export type ProgramIdls = {
    /** `undefined` while the on-chain IDLs load. */
    idls: readonly SourcedIdl[] | undefined;
};

/**
 * Resolves both IDLs a program exposes (PMP `idl` seed, Anchor PDA). `idls` holds them in PMP-first
 * order. The callers share one cached resolution per program and cluster.
 *
 * Known public clusters use a single server route (`/api/idl-latest`) backed by `@solana/idl`, which
 * surfaces native-program IDLs via the fndn fallback authority. Custom / localhost clusters can't use
 * that route — the server has no route to a user's local validator — so `resolveProgramIdlsClient`
 * runs the *same* `@solana/idl` resolver in the browser against the user-supplied RPC URL, loaded via
 * dynamic `import()` so `@solana/idl`'s weight stays out of the bundle for the common known-cluster
 * path (which never resolves IDLs in the browser).
 *
 * `suspense` opts the read into React Suspense (the program-name label renders inside a boundary);
 * other callers leave it off.
 */
export function useProgramIdls(
    programId: string,
    url: string,
    cluster: Cluster,
    { suspense = false }: { suspense?: boolean } = {},
): ProgramIdls {
    const isCustom = shouldUseDirectRpc(cluster, url);

    const { data: serverIdls, isLoading: serverLoading } = useSWRImmutable(
        !isCustom && (['program-idls', programId, cluster] as const),
        () => fetchProgramIdls(programId, cluster),
        // fetchProgramIdls throws on failure (rather than caching an empty result), so cap the
        // retries SWR makes before giving up on a persistently failing endpoint.
        { errorRetryCount: 3, suspense },
    );

    // Custom / local clusters: resolve client-side against the user's RPC. Keyed off `url` so a
    // different endpoint re-resolves; the key is `false` for known clusters so this never runs there
    // (no double-fetch, and the heavy `@solana/idl` chunk only loads when this branch is taken).
    const { data: customIdls, isLoading: customLoading } = useSWRImmutable(
        isCustom && (['program-idls-custom', programId, url] as const),
        () => resolveProgramIdlsClient({ programId, url }),
        // resolveProgramIdlsClient re-throws when nothing resolved and a source errored, so cap the
        // retries (matching the server path) before giving up on a persistently failing local RPC.
        { errorRetryCount: 3, suspense },
    );

    const onChainIdls = isCustom ? customIdls : serverIdls;
    const isOnChainLoading = isCustom ? customLoading : serverLoading;

    const idls = useMemo(() => {
        if (isOnChainLoading) return undefined;
        return onChainIdls ? getOnChainIdls(onChainIdls) : [];
    }, [isOnChainLoading, onChainIdls]);

    return { idls };
}
