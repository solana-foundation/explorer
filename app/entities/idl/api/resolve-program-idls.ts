import { fetchAnchorIdl, fetchLatestIdls, fetchPmpIdl, parseIdl } from '@solana/idl';
import { type Address, type Rpc, type SolanaRpcApi } from '@solana/kit';

import { IdlVariant } from '../model/idl-variant';
import { NON_ANCHOR_PROGRAMS } from './config';

// `createSolanaRpc(url)` produces this; the @solana/idl helpers accept its narrower `SolanaRpcClient`.
type IdlRpc = Rpc<SolanaRpcApi>;

export type ResolveProgramIdlsOptions = {
    /** Resolve the PMP `idl`-seed IDL (canonical + fndn fallback authorities) — off gates the PMP feature. */
    includePmp: boolean;
    /** PMP seed — passed in so this entity doesn't cross-import `program-metadata`. Unused when `includePmp` is false. */
    seed?: string;
};

export type ResolvedProgramIdls = {
    /** Parsed Anchor IDL JSON, or `undefined` when absent / undecodable / not IDL-shaped. */
    anchorIdl: unknown;
    /** Parsed PMP IDL JSON, or `undefined` when absent / undecodable. */
    programMetadataIdl: unknown;
    /** Which tab the card shows first; PMP-first (the newer standard) whenever PMP is present. */
    preferredVariant: IdlVariant;
};

/**
 * Resolve a program's Anchor + PMP `idl`-seed IDLs and the default tab, backed by `@solana/idl`.
 * Shared by the `/api/idl-latest` route (server) and the custom/localhost client resolver, so known
 * and custom clusters resolve identically.
 *
 * When both sources are wanted this is just `fetchLatestIdls` — the package's own `GET /api/latest`
 * resolver (PMP canonical → fndn fallback, Anchor PDA, side by side). Otherwise only the needed
 * fetcher runs: `includePmp` off (the inspector's Anchor-only path) → `fetchAnchorIdl`; a native
 * program → `fetchPmpIdl` only. Native/builtin programs skip the Anchor leg — they can't have an
 * Anchor IDL and some RPCs (SIMD-296) throw, instead of returning absent, for the derived PDA.
 *
 * Every `@solana/idl` fetcher surfaces absent/undecodable as a value and throws **only on RPC
 * failure**, so a blip propagates to the caller (retryable 502 / SWR retry) and is never cached as a
 * false-negative "no IDLs".
 */
export async function resolveProgramIdls(
    rpc: IdlRpc,
    programId: Address,
    { includePmp, seed }: ResolveProgramIdlsOptions,
): Promise<ResolvedProgramIdls> {
    // Native/builtin programs can't have an Anchor IDL — skip the PDA lookup (see NON_ANCHOR_PROGRAMS).
    const resolveAnchor = !NON_ANCHOR_PROGRAMS.has(programId);

    let anchorContent: string | undefined;
    let pmpContent: string | undefined;
    if (resolveAnchor && includePmp) {
        // Both sources → the package's own side-by-side resolver (one round trip per source).
        const { anchor, pmp } = await fetchLatestIdls(rpc, programId, { seed });
        anchorContent = anchor[0]?.content;
        pmpContent = pmp[0]?.content;
    } else {
        // Single source (or neither): call only the fetcher we need.
        if (resolveAnchor) {
            const result = await fetchAnchorIdl(rpc, programId);
            anchorContent = result.status === 'ok' ? result.content : undefined;
        }
        if (includePmp) {
            const result = await fetchPmpIdl(rpc, programId, { seed });
            pmpContent = result.status === 'ok' ? result.content : undefined;
        }
    }

    const anchorIdl = parseAnchorIdl(anchorContent);
    const programMetadataIdl = parseContent(pmpContent);
    return {
        anchorIdl,
        // Prefer PMP (the newer standard) whenever present; Anchor only when it's the sole source.
        preferredVariant: anchorIdl && !programMetadataIdl ? IdlVariant.Anchor : IdlVariant.ProgramMetadata,
        programMetadataIdl,
    };
}

/** Parse PMP content to a JSON object, or `undefined` (absent / not JSON / not an object). */
function parseContent(content?: string): unknown {
    if (!content) return undefined;
    const result = parseIdl(content);
    return result.ok ? result.idl : undefined;
}

/**
 * Parse an Anchor IDL, keeping the shape guard (top-level `instructions` array) so a non-IDL JSON
 * object parked at the derived PDA isn't served as a valid Anchor IDL.
 */
function parseAnchorIdl(content?: string): unknown {
    const idl = parseContent(content);
    return idl && Array.isArray((idl as { instructions?: unknown }).instructions) ? idl : undefined;
}
