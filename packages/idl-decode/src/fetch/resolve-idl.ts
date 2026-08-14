// Where a program's IDL lives: the ordered legs, their vocabulary, and the raw fetcher over them.
// Building a decode client on top is `./index.ts`'s job.
import { type Address, address as assertAddress } from '@solana/kit';

import type { IdlFetcher, IdlFetcherRpc } from '../types.js';
import { fetchAnchorPdaIdl } from './anchor-pda.js';
import { fetchPmpIdl } from './pmp.js';
import { type PublishedIdl, toIdlRpc } from './solana-idl.js';

/** Which on-chain publication a fetched IDL came from. */
export enum IdlSource {
    AnchorPda = 'anchor-pda',
    Pmp = 'pmp',
}

export type LatestIdlFetcherOptions = {
    /** Set `false` to skip the Anchor-PDA leg — native/builtin programs cannot have one and some RPCs throw for the derived PDA. */
    anchor?: boolean;
    /** Pin the PMP metadata authority to one lookup; by default the canonical PDA is tried first, then the fndn fallback. */
    authority?: Address | null;
};

/** One publication leg of the latest-IDL policy: how to read it, and which source a hit attributes. */
type FetchLeg = {
    fetch: () => Promise<PublishedIdl | undefined>;
    source: IdlSource;
};

/** The winning leg's IDL together with the source that produced it. */
export type ResolvedIdl = PublishedIdl & { source: IdlSource };

// The program's on-chain publications, walked in order until one hits — PMP first (canonical PDA,
// then the fndn fallback authority), the Anchor PDA next unless `anchor` is false. Both fetch routes
// resolve through here so neither the ordering nor the attribution can drift between them. Throws as
// the legs do: a corrupt leg surfaces its coded IdlError instead of being masked by the next one.
// Not @solana/idl's own `fetchIdlWrapped`: it cannot skip the Anchor leg, and a valid Anchor IDL there
// masks a corrupt PMP one (DESIGN.md).
export async function resolveOnChainIdl(
    rpc: IdlFetcherRpc,
    program: Address,
    { anchor = true, authority }: LatestIdlFetcherOptions,
    abortSignal: AbortSignal | undefined,
): Promise<ResolvedIdl | undefined> {
    const idlRpc = toIdlRpc(rpc, abortSignal);
    const legs: FetchLeg[] = [
        { fetch: () => fetchPmpIdl(idlRpc, program, authority), source: IdlSource.Pmp },
        ...(anchor ? [{ fetch: () => fetchAnchorPdaIdl(idlRpc, program), source: IdlSource.AnchorPda }] : []),
    ];
    for (const leg of legs) {
        const published = await leg.fetch();
        if (published !== undefined) return { ...published, source: leg.source };
    }
    return undefined;
}

/**
 * A program's "latest" IDL: the PMP `idl` metadata first (canonical PDA, then the fndn fallback
 * authority), the Anchor IDL PDA as the fallback. Absent on every lookup resolves `undefined`;
 * corrupt data throws typed `IDL_ERROR__IDL_PARSE_FAILED` without falling through (corruption is
 * surfaced, not masked). The signal reaches both legs' account reads; url-sourced PMP payloads go
 * through global fetch and are not signal-bound.
 */
export function createLatestIdlFetcher(rpc: IdlFetcherRpc, options: LatestIdlFetcherOptions = {}): IdlFetcher {
    return async (programAddress, config) => {
        config?.abortSignal?.throwIfAborted();
        const resolved = await resolveOnChainIdl(rpc, assertAddress(programAddress), options, config?.abortSignal);
        return resolved?.idl;
    };
}
