'use client';

import { type Idl, Program } from '@coral-xyz/anchor';
import { shouldUseDirectRpc } from '@entities/cluster';
import { getProvider, IdlVariant, type SupportedIdl } from '@entities/idl';
import { IDL_SEED, useProgramCanonicalMetadata } from '@entities/program-metadata';
import { PublicKey } from '@solana/web3.js';
import { fetch } from 'cross-fetch';
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
 * Known public clusters use a single server route (`/api/idl-latest`) backed by `@solana/idl`,
 * which also surfaces native-program IDLs via the fndn fallback authority and decides the preferred
 * tab from last-write slots. Custom / localhost clusters can't use the server route (the package is
 * server-only and the route only knows public RPCs), so they fetch client-side with the existing
 * primitives and default to the PMP tab.
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

    // Custom / local clusters: fetch client-side. `useProgramCanonicalMetadata` gates on `enabled`
    // and the Anchor SWR key is `false` off-path, so neither runs for known clusters (no double-fetch).
    const { data: customAnchorIdl, isLoading: customAnchorLoading } = useSWRImmutable(
        isCustom && (['program-idls-anchor-custom', programId, url] as const),
        () => fetchAnchorIdlClient(programId, url),
    );
    const { programMetadata: customPmpIdl, isLoading: customPmpLoading } = useProgramCanonicalMetadata(
        programId,
        IDL_SEED,
        url,
        cluster,
        isCustom && PMP_IDL_ENABLED,
    );

    if (isCustom) {
        return {
            anchorIdl: customAnchorIdl ?? undefined,
            isLoading: customAnchorLoading || customPmpLoading,
            preferredVariant: IdlVariant.ProgramMetadata,
            programMetadataIdl: (customPmpIdl ?? undefined) as SupportedIdl | undefined,
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

async function fetchAnchorIdlClient(programId: string, url: string): Promise<Idl | undefined> {
    try {
        return (await Program.fetchIdl<Idl>(new PublicKey(programId), getProvider(url))) ?? undefined;
    } catch (error) {
        Logger.error(new Error('[idl] Error fetching Anchor IDL on custom cluster', { cause: error }), { programId });
        return undefined;
    }
}
