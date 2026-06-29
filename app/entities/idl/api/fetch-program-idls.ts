import { Logger } from '@/app/shared/lib/logger';
import { type Cluster } from '@/app/utils/cluster';

import { IdlVariant } from '../model/idl-variant';
import { type SupportedIdl } from '../model/idl-version';

export type FetchedProgramIdls = {
    anchorIdl: SupportedIdl | undefined;
    programMetadataIdl: SupportedIdl | undefined;
    /** Which tab the card shows first — PMP when present, Anchor only when it's the sole source. */
    preferredVariant: IdlVariant;
};

/**
 * Fetch a program's resolved IDLs from the shared, CDN-cached `/api/idl-latest` route — the single
 * known-cluster IDL source for the IDL card, the program-name label, and the transaction inspector.
 * The PMP feature gate lives in the route, so every consumer hits the same cache entry and reads the
 * field it needs (`anchorIdl` / `programMetadataIdl`).
 *
 * Throws on a non-ok response instead of returning empties: under `useSWRImmutable` a returned value
 * is cached as a success and never revalidated, so a transient 502 would stick as "no IDLs" for the
 * session. Throwing lets SWR treat it as an error and retry (see callers' `errorRetryCount`).
 */
export async function fetchProgramIdls(programId: string, cluster: Cluster): Promise<FetchedProgramIdls> {
    try {
        const response = await fetch(`/api/idl-latest?programAddress=${programId}&cluster=${cluster}`);
        if (!response.ok) {
            throw new Error(`/api/idl-latest returned ${response.status}`);
        }
        const { idls } = await response.json();
        // The route omits absent IDLs from the payload entirely (never null), so plain optional access
        // already yields `undefined` for missing sources.
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
