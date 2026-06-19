import { fetchAnchorIdl, fetchPmpIdl } from '@solana/idl';
import { type Address, type Rpc, type SolanaRpcApi } from '@solana/kit';

import { Logger } from '@/app/shared/lib/logger';

// `createSolanaRpc(url)` produces this; the @solana/idl helpers accept its narrower `SolanaRpcClient`.
type IdlRpc = Rpc<SolanaRpcApi>;

export type ResolvedAnchorIdl = {
    /** Parsed IDL JSON. */
    idl: unknown;
    /** The derived Anchor IDL account address — used for last-write-slot recency lookups. */
    address: Address;
};

/**
 * Resolve + parse the Anchor IDL for a program.
 *
 * Returns `undefined` when there is no Anchor IDL account at the derived PDA (`absent`), or when an
 * account is present but unusable — its bytes don't decode (`corrupt`: bad zlib/framing), aren't
 * valid JSON, or are valid JSON of the wrong shape. These are non-actionable "this isn't an Anchor
 * program" outcomes that a caller can safely cache.
 *
 * `fetchAnchorIdl` surfaces every *data* outcome as an `IdlResult` value and throws **only on RPC
 * failure**, so a transient blip / misconfiguration propagates out of here unswallowed — the caller
 * classifies it (`isTransientRpcError`) and chooses a retryable 502 vs. a Sentry page. A transient
 * RPC failure must never be folded into a cacheable negative result.
 */
export async function resolveAnchorIdl(
    rpc: IdlRpc,
    programId: Address,
    context: Record<string, unknown>,
): Promise<ResolvedAnchorIdl | undefined> {
    const result = await fetchAnchorIdl(rpc, programId);
    if (result.status === 'absent') return undefined;
    if (result.status === 'corrupt') {
        // Account present but its bytes don't decode as an Anchor IDL (bad framing / zlib payload).
        Logger.warn('[idl] Anchor IDL account present but undecodable', { ...context, reason: result.reason });
        return undefined;
    }

    // `ok` carries the raw decompressed string without validating its shape, so an account whose
    // bytes are valid JSON but not IDL-shaped (e.g. `{"hello":"world"}`) would otherwise be served +
    // cached as a "valid" Anchor IDL. Reject non-JSON and anything missing the top-level
    // `instructions` array.
    let idl: unknown;
    try {
        idl = JSON.parse(result.content);
    } catch {
        Logger.warn('[idl] Anchor IDL content is not valid JSON', context);
        return undefined;
    }
    if (!idl || typeof idl !== 'object' || !Array.isArray((idl as { instructions?: unknown }).instructions)) {
        Logger.warn('[idl] Anchor IDL has unexpected shape', context);
        return undefined;
    }
    return { address: result.address, idl };
}

export type ResolvedPmpIdl = {
    /** Raw on-chain content (not parsed) — the caller decides how to interpret it. */
    content: string;
    address: Address;
    authority: Address | null;
};

/**
 * Resolve the raw on-chain PMP metadata content for a program/seed: canonical authority first, then
 * (when `useFallbackAuthorities`) the non-canonical fndn fallback authorities that surface
 * Foundation-published native-program IDLs.
 *
 * `fetchPmpIdl` walks those lookups, returning the first `ok` (skipping a `corrupt`/empty earlier
 * authority — native programs' canonical `idl` slot is typically empty and the real Foundation IDL
 * lives on the fndn fallback). A `PmpIdlResult` that isn't `ok` (`absent` = nothing published,
 * `corrupt` = bytes don't decode) maps to `undefined` — a non-actionable outcome the caller can
 * cache. It throws **only on RPC failure** (transient node issue, transport 5xx/429, ...), which
 * propagates so the caller can return a retryable, *uncached* 502 instead of poisoning the CDN cache
 * with a false-negative for everyone.
 */
export async function resolvePmpIdl(
    rpc: IdlRpc,
    programId: Address,
    seed: string,
    useFallbackAuthorities: boolean,
): Promise<ResolvedPmpIdl | undefined> {
    const result = await fetchPmpIdl(rpc, programId, {
        // `authority` selects the lookup set: `null` = canonical only; `undefined` (the default) =
        // canonical + the fndn fallback authorities. Load-bearing, not a stand-in for absent.
        // eslint-disable-next-line unicorn/no-null -- library API: null = canonical-only lookup
        authority: useFallbackAuthorities ? undefined : null,
        seed,
    });
    if (result.status !== 'ok') return undefined;
    return { address: result.address, authority: result.authority, content: result.content };
}

/**
 * Most-recent on-chain write slot for an account, or `undefined` when it has no signatures or the
 * lookup fails. Slot recency is best-effort tab-ordering metadata, so failures degrade silently.
 */
export async function lastWriteSlot(rpc: IdlRpc, account: Address): Promise<bigint | undefined> {
    try {
        const signatures = await rpc.getSignaturesForAddress(account, { limit: 1 }).send();
        return signatures[0]?.slot ?? undefined;
    } catch {
        return undefined;
    }
}
