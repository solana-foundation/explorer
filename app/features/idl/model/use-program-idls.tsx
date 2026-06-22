'use client';

import { shouldUseDirectRpc } from '@entities/cluster';
import { fetchProgramIdls, IdlVariant, resolveProgramIdlsClient, type SupportedIdl } from '@entities/idl';
import useSWRImmutable from 'swr/immutable';

import { type Cluster } from '@/app/utils/cluster';
import { isEnvEnabled } from '@/app/utils/env';

const PMP_IDL_ENABLED = isEnvEnabled(process.env.NEXT_PUBLIC_PMP_IDL_ENABLED);

export type ProgramIdls = {
    anchorIdl: SupportedIdl | undefined;
    programMetadataIdl: SupportedIdl | undefined;
    /** Which tab the card shows first — PMP when present, Anchor only when it's the sole source. */
    preferredVariant: IdlVariant;
    isLoading: boolean;
};

/**
 * Resolves every IDL the program IDL card renders (Anchor, PMP `idl` seed) plus the preferred tab.
 *
 * Known public clusters use a single server route (`/api/idl-latest`) backed by `@solana/idl`, which
 * surfaces native-program IDLs via the fndn fallback authority. Custom / localhost clusters can't use
 * that route — the server has no route to a user's local validator — so `resolveProgramIdlsClient`
 * runs the *same* `@solana/idl` resolver in the browser against the user-supplied RPC URL, loaded via
 * dynamic `import()` so `@solana/idl`'s weight stays out of the bundle for the common known-cluster
 * path (which never resolves IDLs in the browser).
 */
export function useProgramIdls(programId: string, url: string, cluster: Cluster): ProgramIdls {
    const isCustom = shouldUseDirectRpc(cluster, url);

    const { data: serverIdls, isLoading: serverLoading } = useSWRImmutable(
        !isCustom && (['program-idls', programId, cluster] as const),
        () => fetchProgramIdls(programId, cluster),
        // fetchProgramIdls throws on failure (rather than caching an empty result), so cap the
        // retries SWR makes before giving up on a persistently failing endpoint.
        { errorRetryCount: 3 },
    );

    // Custom / local clusters: resolve client-side against the user's RPC. Keyed off `url` so a
    // different endpoint re-resolves; the key is `false` for known clusters so this never runs there
    // (no double-fetch, and the heavy `@solana/idl` chunk only loads when this branch is taken).
    const { data: customIdls, isLoading: customLoading } = useSWRImmutable(
        isCustom && (['program-idls-custom', programId, url] as const),
        () => resolveProgramIdlsClient({ includePmp: PMP_IDL_ENABLED, programId, url }),
        // resolveProgramIdlsClient re-throws when nothing resolved and a source errored, so cap the
        // retries (matching the server path) before giving up on a persistently failing local RPC.
        { errorRetryCount: 3 },
    );

    if (isCustom) {
        return {
            anchorIdl: customIdls?.anchorIdl,
            isLoading: customLoading,
            preferredVariant: customIdls?.preferredVariant ?? IdlVariant.ProgramMetadata,
            programMetadataIdl: customIdls?.programMetadataIdl,
        };
    }

    return {
        anchorIdl: serverIdls?.anchorIdl,
        isLoading: serverLoading,
        preferredVariant: serverIdls?.preferredVariant ?? IdlVariant.ProgramMetadata,
        programMetadataIdl: serverIdls?.programMetadataIdl,
    };
}
