import { address, createSolanaRpc } from '@solana/kit';

import { Logger } from '@/app/shared/lib/logger';

import { type IdlVariant } from '../model/idl-variant';
import { type SupportedIdl } from '../model/idl-version';

export type ResolveProgramIdlsClientArgs = {
    programId: string;
    /** The user-supplied RPC URL (custom cluster or localhost) to resolve directly against. */
    url: string;
    /** PMP seed (`idl`). */
    seed: string;
    /** Skip the PMP lookup when the PMP IDL feature flag is off. */
    includePmp: boolean;
};

export type ResolvedClientIdls = {
    anchorIdl: SupportedIdl | undefined;
    programMetadataIdl: SupportedIdl | undefined;
    /** Which tab the card should show first, based on on-chain write recency. */
    preferredVariant: IdlVariant;
};

export type ResolveAnchorIdlClientArgs = {
    programId: string;
    /** The user-supplied RPC URL (custom cluster or localhost) to resolve directly against. */
    url: string;
};

/**
 * Lazily load + run the shared IDL orchestrator **in the browser** against a user-supplied RPC URL,
 * for custom / localhost clusters the server route can't reach (the server has no route to a user's
 * `localhost:8899`). Same `@solana/idl` resolution as `/api/idl-latest`: the fndn fallback authority
 * for the PMP `idl` seed and the recency-based preferred tab — so a local validator surfaces exactly
 * what a public cluster does (including Foundation-published native IDLs).
 *
 * `resolve-program-idls` statically pulls in `@solana/idl` (~45 KB gzip of yaml/toml/pako + crypto/
 * zlib polyfills), so it's reached only through the dynamic `import()` here — keeping that weight out
 * of the program-page bundle for the common known-cluster path, which resolves on the server.
 *
 * Error policy differs from the route: there's no CDN cache to poison and no Sentry to page on the
 * client, so a single failed source degrades to `undefined` with a warning. The orchestrator still
 * throws when *nothing* resolved and a source errored, so SWR retries instead of caching a
 * false-negative "no IDLs" for the session (e.g. a brief local-validator blip).
 */
export async function resolveProgramIdlsClient({
    programId,
    url,
    seed,
    includePmp,
}: ResolveProgramIdlsClientArgs): Promise<ResolvedClientIdls> {
    const { resolveProgramIdls } = await import('./resolve-program-idls');
    const { anchorIdl, programMetadataIdl, preferredVariant, rejections } = await resolveProgramIdls(
        createSolanaRpc(url),
        address(programId),
        { includeAnchor: true, includePmp, seed },
    );
    for (const reason of rejections) {
        Logger.warn('[idl] client IDL source failed (custom/localhost RPC); served the others', {
            cluster: 'custom',
            error: reason instanceof Error ? reason.message : String(reason),
            programAddress: programId,
        });
    }
    return {
        anchorIdl: anchorIdl as SupportedIdl | undefined,
        preferredVariant,
        programMetadataIdl: programMetadataIdl as SupportedIdl | undefined,
    };
}

/** Anchor-only client resolver (custom/localhost) — the `includePmp: false` slice of the orchestrator. */
export async function resolveAnchorIdlClient({ programId, url }: ResolveAnchorIdlClientArgs): Promise<unknown> {
    const { resolveProgramIdls } = await import('./resolve-program-idls');
    const { anchorIdl } = await resolveProgramIdls(createSolanaRpc(url), address(programId), {
        includeAnchor: true,
        includePmp: false,
    });
    return anchorIdl;
}
