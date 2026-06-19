import { address, createSolanaRpc } from '@solana/kit';

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
    /** Which tab the card should show first (PMP-first when both are present). */
    preferredVariant: IdlVariant;
};

export type ResolveAnchorIdlClientArgs = {
    programId: string;
    /** The user-supplied RPC URL (custom cluster or localhost) to resolve directly against. */
    url: string;
};

/**
 * Lazily load + run the shared IDL resolver **in the browser** against a user-supplied RPC URL, for
 * custom / localhost clusters the server route can't reach (the server has no route to a user's
 * `localhost:8899`). Same `@solana/idl` resolution as `/api/idl-latest` — the fndn fallback authority
 * for the PMP `idl` seed — so a local validator surfaces exactly what a public cluster does
 * (including Foundation-published native IDLs).
 *
 * `resolve-program-idls` statically pulls in `@solana/idl` (~45 KB gzip of yaml/toml/pako + crypto/
 * zlib polyfills), so it's reached only through the dynamic `import()` here — keeping that weight out
 * of the program-page bundle for the common known-cluster path, which resolves on the server.
 *
 * The resolver throws only on RPC failure, which here propagates so SWR retries rather than caching a
 * false-negative "no IDLs" for the session (e.g. a brief local-validator blip).
 */
export async function resolveProgramIdlsClient({
    programId,
    url,
    seed,
    includePmp,
}: ResolveProgramIdlsClientArgs): Promise<ResolvedClientIdls> {
    const { resolveProgramIdls } = await import('./resolve-program-idls');
    const { anchorIdl, programMetadataIdl, preferredVariant } = await resolveProgramIdls(
        createSolanaRpc(url),
        address(programId),
        { includePmp, seed },
    );
    return {
        anchorIdl: anchorIdl as SupportedIdl | undefined,
        preferredVariant,
        programMetadataIdl: programMetadataIdl as SupportedIdl | undefined,
    };
}

/** Anchor-only client resolver (custom/localhost) — the `includePmp: false` slice of the resolver. */
export async function resolveAnchorIdlClient({ programId, url }: ResolveAnchorIdlClientArgs): Promise<unknown> {
    const { resolveProgramIdls } = await import('./resolve-program-idls');
    const { anchorIdl } = await resolveProgramIdls(createSolanaRpc(url), address(programId), { includePmp: false });
    return anchorIdl;
}
