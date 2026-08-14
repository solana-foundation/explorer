// Where a program's IDL lives: the ordered legs and the raw fetcher over them. Building a decode
// client on top is `./index.ts`'s job; the source vocabulary is `./solana-idl.ts`'s. Deliberately not
// upstream's own `fetchIdlWrapped` — it cannot skip the Anchor leg, and a valid Anchor IDL there masks
// a corrupt PMP one (DESIGN.md).
import { type Address, address as assertAddress } from '@solana/kit';

import type { IdlFetcher, IdlFetcherRpc } from '../types.js';
import { type PublishedIdl, toIdlRpc } from './solana-idl.js';
import { fetchAnchorPdaIdl } from './source-anchor-pda.js';
import { fetchPmpIdl } from './source-pmp.js';

export type LatestIdlFetcherOptions = {
    /** Set `false` to skip the Anchor-PDA leg — native/builtin programs cannot have one and some RPCs throw for the derived PDA. */
    anchor?: boolean;
    /** Pin the PMP metadata authority to one lookup; by default the canonical PDA is tried first, then the fndn fallback. */
    authority?: Address | null;
};

/**
 * The program's on-chain publications, walked until one hits: PMP first (canonical PDA, then the fndn
 * fallback authority), the Anchor PDA next unless `anchor` is false. Throws as the legs do — a corrupt
 * leg surfaces its coded `IdlError` instead of being masked by the next.
 */
export async function resolveOnChainIdl(
    rpc: IdlFetcherRpc,
    program: Address,
    { anchor = true, authority }: LatestIdlFetcherOptions,
    abortSignal: AbortSignal | undefined,
): Promise<PublishedIdl | undefined> {
    const idlRpc = toIdlRpc(rpc, abortSignal);
    const legs = [
        () => fetchPmpIdl(idlRpc, program, authority),
        ...(anchor ? [() => fetchAnchorPdaIdl(idlRpc, program)] : []),
    ];
    for (const leg of legs) {
        const published = await leg();
        if (published !== undefined) return published;
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
