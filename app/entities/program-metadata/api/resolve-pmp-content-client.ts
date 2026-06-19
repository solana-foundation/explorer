import { address, createSolanaRpc } from '@solana/kit';

export type ResolvePmpContentClientArgs = {
    programAddress: string;
    /** PMP seed (`idl`, `security`, …). */
    seed: string;
    /** The user-supplied RPC URL (custom cluster or localhost) to resolve directly against. */
    url: string;
    /** Try the fndn fallback authorities after the canonical miss (IDL seed only). */
    useFallbackAuthorities: boolean;
};

/**
 * Resolve a program's canonical PMP metadata content **in the browser** against a user-supplied RPC
 * URL, for custom/localhost clusters the API route can't reach. `@solana/idl` is the primary source:
 * `fetchPmpIdl` tries the canonical authority first, then (when `useFallbackAuthorities`) the fndn
 * fallback authorities, returning a `PmpIdlResult` (`ok`/`corrupt`/`absent`). Returns the parsed JSON
 * content, or `undefined` when absent/undecodable/unparseable.
 *
 * NOTE: unlike the idl entity's `resolveProgramIdlsClient` (which re-throws transient RPC errors so
 * SWR retries), this swallows a transient blip to `undefined`, which useSWRImmutable then caches as
 * "no metadata" for the session. Intentional: this is a per-session client cache (not the shared CDN
 * cache the server route guards), so a false-negative here is a degraded label, not a poisoned shared
 * response. `fetchPmpIdl` throws on RPC failure, so the `try/catch` below is what enforces the swallow.
 *
 * `@solana/idl` is heavy and lazily imported so its weight stays out of the common bundle — this
 * runs only on the custom/localhost branch of the metadata hooks.
 */
export async function resolvePmpContentClient({
    programAddress,
    seed,
    url,
    useFallbackAuthorities,
}: ResolvePmpContentClientArgs): Promise<unknown> {
    const { fetchPmpIdl } = await import('@solana/idl');
    let content: string;
    try {
        const pmp = await fetchPmpIdl(createSolanaRpc(url), address(programAddress), {
            // eslint-disable-next-line unicorn/no-null -- library API: undefined = canonical + fndn fallback, null = canonical-only
            authority: useFallbackAuthorities ? undefined : null,
            seed,
        });
        if (pmp.status !== 'ok') return undefined;
        content = pmp.content;
    } catch {
        // Transient/RPC failure on a per-session client cache — degrade to "no metadata" (see NOTE).
        return undefined;
    }
    try {
        return JSON.parse(content) ?? undefined;
    } catch {
        return undefined;
    }
}
