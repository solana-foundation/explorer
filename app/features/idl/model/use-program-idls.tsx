'use client';

import { shouldUseDirectRpc } from '@entities/cluster';
import { IdlVariant, resolveProgramIdlsClient, type SupportedIdl } from '@entities/idl';
import { IDL_SEED } from '@entities/program-metadata';
import useSWRImmutable from 'swr/immutable';

import { Logger } from '@/app/shared/lib/logger';
import { type Cluster } from '@/app/utils/cluster';
import { isEnvEnabled } from '@/app/utils/env';

const PMP_IDL_ENABLED = isEnvEnabled(process.env.NEXT_PUBLIC_PMP_IDL_ENABLED);

export type ProgramIdls = {
    anchorIdl: SupportedIdl | undefined;
    programMetadataIdl: SupportedIdl | undefined;
    /** Which tab the card should show first, based on on-chain write recency. */
    preferredVariant: IdlVariant;
    isLoading: boolean;
};

type ResolvedIdls = Omit<ProgramIdls, 'isLoading'>;

/**
 * Resolves every IDL the program IDL card renders (Anchor, PMP `idl` seed) plus the preferred tab.
 *
 * Known public clusters use a single server route (`/api/idl-latest`) backed by `@solana/idl`, which
 * surfaces native-program IDLs via the fndn fallback authority and decides the preferred tab from
 * last-write slots. Custom / localhost clusters can't use that route — the server has no route to a
 * user's local validator — so `resolveProgramIdlsClient` runs the *same* `@solana/idl` resolvers in
 * the browser against the user-supplied RPC URL, for full parity (fndn fallback + recency-based tab).
 * That resolver is loaded via dynamic `import()`, so `@solana/idl`'s weight stays out of the bundle
 * for the common known-cluster path, which never resolves IDLs in the browser.
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
        () => resolveProgramIdlsClient({ includePmp: PMP_IDL_ENABLED, programId, seed: IDL_SEED, url }),
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

async function fetchProgramIdls(programId: string, cluster: Cluster): Promise<ResolvedIdls> {
    try {
        const response = await fetch(
            `/api/idl-latest?programAddress=${programId}&cluster=${cluster}&pmp=${PMP_IDL_ENABLED ? 1 : 0}`,
        );
        if (!response.ok) {
            // Throw instead of returning empties: under useSWRImmutable a returned value is cached as
            // a successful result and never revalidated, so a transient 502 would stick as "no IDLs"
            // for the session. Throwing lets SWR treat it as an error and retry (see errorRetryCount).
            throw new Error(`/api/idl-latest returned ${response.status}`);
        }
        const { idls } = await response.json();
        // The route omits absent IDLs from the payload entirely (never null), so plain optional
        // access already yields `undefined` for missing sources.
        return {
            anchorIdl: idls?.anchor as SupportedIdl | undefined,
            preferredVariant: (idls?.preferred as IdlVariant) ?? IdlVariant.ProgramMetadata,
            programMetadataIdl: idls?.programMetadata as SupportedIdl | undefined,
        };
    } catch (error) {
        Logger.warn('[idl] Failed to fetch program IDLs', {
            cluster,
            error: error instanceof Error ? error.message : String(error),
            programId,
        });
        throw error;
    }
}
