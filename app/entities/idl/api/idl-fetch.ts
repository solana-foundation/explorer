import { buildPmpIdlLookups, fetchAnchorIdl } from '@solana/idl';
import {
    type Address,
    isSolanaError,
    type Rpc,
    SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND,
    SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR,
    SOLANA_ERROR__JSON_RPC__PARSE_ERROR,
    SOLANA_ERROR__JSON_RPC__SCAN_ERROR,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_CLEANED_UP,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_NOT_AVAILABLE,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_STATUS_NOT_AVAILABLE_YET,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_KEY_EXCLUDED_FROM_SECONDARY_INDEX,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_LONG_TERM_STORAGE_SLOT_SKIPPED,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_MIN_CONTEXT_SLOT_NOT_REACHED,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_NO_SNAPSHOT,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_NODE_UNHEALTHY,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SLOT_SKIPPED,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_TRANSACTION_HISTORY_NOT_AVAILABLE,
    SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR,
    type SolanaError,
    type SolanaErrorCode,
    type SolanaRpcApi,
} from '@solana/kit';
import { fetchMetadataContent } from '@solana-program/program-metadata';

import { Logger } from '@/app/shared/lib/logger';

// `createSolanaRpc(url)` produces this; the @solana/idl helpers accept its narrower `SolanaRpcClient`.
type IdlRpc = Rpc<SolanaRpcApi>;

// SolanaError codes that represent ephemeral upstream-state issues for a `getAccountInfo` call: the
// node is briefly unhealthy, the slot was skipped, the snapshot/block isn't available yet, the
// JSON-RPC server returned a generic "Internal error", etc. They are not actionable at the app layer
// and recur naturally — let the client retry. Everything outside this set (auth, plan, malformed
// responses, programmer-bug-class codes) is treated as misconfig so it surfaces in Sentry.
const TRANSIENT_RPC_ERROR_CODES = new Set<SolanaErrorCode>([
    SOLANA_ERROR__JSON_RPC__INTERNAL_ERROR,
    SOLANA_ERROR__JSON_RPC__PARSE_ERROR,
    SOLANA_ERROR__JSON_RPC__SCAN_ERROR,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_CLEANED_UP,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_NOT_AVAILABLE,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_BLOCK_STATUS_NOT_AVAILABLE_YET,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_KEY_EXCLUDED_FROM_SECONDARY_INDEX,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_LONG_TERM_STORAGE_SLOT_SKIPPED,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_MIN_CONTEXT_SLOT_NOT_REACHED,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_NO_SNAPSHOT,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_NODE_UNHEALTHY,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SLOT_SKIPPED,
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_TRANSACTION_HISTORY_NOT_AVAILABLE,
]);

/**
 * Classify a `SolanaError` from a read RPC call as an ephemeral upstream blip (retryable) vs. a
 * persistent misconfiguration (should page). Shared by every IDL route so transient/misconfig
 * handling stays consistent.
 */
export function classifySolanaError(error: SolanaError): 'transient' | 'misconfig' {
    if (TRANSIENT_RPC_ERROR_CODES.has(error.context.__code)) return 'transient';
    if (isSolanaError(error, SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR)) {
        // 5xx = upstream is sick, retryable. 429 = backpressure, also retryable. Everything
        // else in the 4xx range (401/403 wrong token, 404 wrong URL, 410, ...) is persistent
        // misconfig and should page.
        const { statusCode } = error.context;
        return statusCode >= 500 || statusCode === 429 ? 'transient' : 'misconfig';
    }
    return 'misconfig';
}

export type ResolvedAnchorIdl = {
    /** Parsed IDL JSON. */
    idl: unknown;
    /** The derived Anchor IDL account address — used for last-write-slot recency lookups. */
    address: Address;
};

/**
 * Resolve + parse the Anchor IDL for a program.
 *
 * Returns `undefined` when there is no Anchor IDL account at the derived PDA, or when an account is
 * present but its bytes don't decode/parse as a valid IDL (corrupt zlib, invalid JSON). These are
 * non-actionable "this isn't an Anchor program" outcomes that a caller can safely cache.
 *
 * Re-throws `SolanaError`s (transient RPC blips, misconfiguration) so the caller can classify them
 * and choose between a retryable 502 and a Sentry page — a transient RPC failure must never be
 * swallowed into a cacheable negative result.
 */
export async function resolveAnchorIdl(
    rpc: IdlRpc,
    programId: Address,
    context: Record<string, unknown>,
): Promise<ResolvedAnchorIdl | undefined> {
    try {
        const anchor = await fetchAnchorIdl(rpc, programId);
        if (!anchor) return undefined;
        // `fetchAnchorIdl` returns the raw decompressed string without validating its shape, so an
        // account whose bytes are valid JSON but not IDL-shaped (e.g. `{"hello":"world"}`) would
        // otherwise be served + cached as a "valid" Anchor IDL. Reject anything missing the top-level
        // `instructions` array, matching the guard the old `decodeIdl` path enforced.
        const idl = JSON.parse(anchor.content);
        if (!idl || typeof idl !== 'object' || !Array.isArray((idl as { instructions?: unknown }).instructions)) {
            throw new Error('Decoded Anchor IDL has unexpected shape');
        }
        return { address: anchor.address, idl };
    } catch (error) {
        if (isSolanaError(error)) throw error;
        // Account present but its bytes don't decode as a valid Anchor IDL (bad zlib payload,
        // invalid JSON, or valid JSON of the wrong shape). Treat as non-Anchor.
        Logger.warn('[idl] Anchor IDL account present but undecodable', {
            ...context,
            decodeError: error instanceof Error ? error.message : String(error),
        });
        return undefined;
    }
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
 * A missing account (`ACCOUNT_NOT_FOUND`) is the expected "no metadata at this authority" outcome
 * and is skipped, ultimately returning `undefined`. Any *other* RPC error (transient node issue,
 * transport 5xx/429, ...) is re-thrown so the caller can return a retryable, **uncached** 502
 * rather than poisoning the CDN cache with a false-negative for everyone. This is the key
 * difference from `@solana/idl`'s `fetchPmpIdl`, which swallows every error (including transient
 * RPC failures) to a null result.
 */
export async function resolvePmpIdl(
    rpc: IdlRpc,
    programId: Address,
    seed: string,
    useFallbackAuthorities: boolean,
): Promise<ResolvedPmpIdl | undefined> {
    // `buildPmpIdlLookups` distinguishes `undefined` (canonical + fndn fallback authorities) from
    // `null` (canonical authority only), so the `null` here is load-bearing, not a stand-in for absent.
    // eslint-disable-next-line unicorn/no-null -- library API: null = canonical-only lookup
    const lookups = await buildPmpIdlLookups(programId, seed, useFallbackAuthorities ? undefined : null);

    for (const lookup of lookups) {
        let content: string;
        try {
            content = await fetchMetadataContent(rpc, programId, seed, lookup.authority);
        } catch (error) {
            if (isSolanaError(error, SOLANA_ERROR__ACCOUNTS__ACCOUNT_NOT_FOUND)) continue;
            throw error;
        }
        // Empty content means "present but nothing useful here" — fall through to the next (fallback)
        // authority. This is intentional and load-bearing for native programs: their canonical `idl`
        // authority is typically empty, and the fndn fallback authority is where the real Foundation-
        // published IDL lives. (The old client path threw on empty content; skipping is correct here.)
        if (content) {
            return { address: lookup.address, authority: lookup.authority, content };
        }
    }

    return undefined;
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
