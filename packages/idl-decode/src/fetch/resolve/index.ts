// Where a program's IDL lives — the ordered legs, their sources and the raw fetcher over them; this
// file is the submodule's whole signature. Building a decode client on top is `../index.ts`'s job.
// Deliberately not upstream's own `fetchIdlWrapped` — it cannot skip the Anchor leg, and a valid Anchor
// IDL there masks a corrupt PMP one (DESIGN.md).
import { type Address, address as assertAddress } from '@solana/kit';

import type { IdlFetcher, IdlFetcherRpc } from '../../types.js';
import { type PublishedIdl, toIdlRpc } from './solana-idl.js';
import { fetchAnchorPdaIdl } from './source-anchor-pda.js';
import { fetchBufferIdl } from './source-buffer.js';
import { fetchPmpIdl } from './source-pmp.js';

export { IdlSource } from './solana-idl.js';
export type { PublishedIdl } from './solana-idl.js';

export type OnChainIdlOptions = {
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
    { anchor = true, authority }: OnChainIdlOptions,
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
 * The IDL one named account holds — nothing derived, so the lookup knobs do not apply. Same throw
 * policy as the legs: undecodable bytes surface as a coded `IdlError`.
 */
export async function resolveBufferIdl(
    rpc: IdlFetcherRpc,
    buffer: Address,
    abortSignal: AbortSignal | undefined,
): Promise<PublishedIdl | undefined> {
    return fetchBufferIdl(toIdlRpc(rpc, abortSignal), buffer);
}

/**
 * {@link resolveOnChainIdl} as a reusable {@link IdlFetcher}: resolves the raw IDL, `undefined` when no
 * publication has one, throwing only on transport failure or abort. The signal reaches both legs'
 * account reads; url-sourced PMP payloads go through global fetch and are not signal-bound.
 */
export function createOnChainIdlFetcher(rpc: IdlFetcherRpc, options: OnChainIdlOptions = {}): IdlFetcher {
    return async (programAddress, config) => {
        config?.abortSignal?.throwIfAborted();
        const resolved = await resolveOnChainIdl(rpc, assertAddress(programAddress), options, config?.abortSignal);
        return resolved?.idl;
    };
}
