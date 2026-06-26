import { address, createSolanaRpc } from '@solana/kit';

import { type ProgramIdlPair, type SupportedIdl } from '../model/idl-version';

export type ResolveProgramIdlsClientArgs = {
    programId: string;
    /** The user-supplied RPC URL (custom cluster or localhost) to resolve directly against. */
    url: string;
};

/**
 * Lazily load + run the shared IDL resolver **in the browser** against a user-supplied RPC URL, for
 * custom / localhost clusters the server route can't reach (the server has no route to a user's
 * `localhost:8899`). Same `@solana/idl` resolution as `/api/idl-latest` — the fndn fallback authority
 * for the PMP `idl` seed — so a local validator surfaces exactly what a public cluster does
 * (including Foundation-published native IDLs). Both sources are resolved; consumers read the field
 * they need (the tx-decoder takes `anchorIdl`, the program-name label takes `programMetadataIdl`).
 *
 * `resolve-program-idls` statically pulls in `@solana/idl` (~40 KB gzip — pako/yaml/toml — measured as
 * the First Load JS it adds across the `/address/*` and `/tx/*` routes, since it's reachable from the
 * broadly-used `useAnchorProgram`), so it's reached only through the dynamic `import()` here — keeping
 * that weight out of the bundle for the common known-cluster path, which resolves on the server.
 *
 * The resolver throws only on RPC failure, which here propagates so SWR retries rather than caching a
 * false-negative "no IDLs" for the session (e.g. a brief local-validator blip).
 */
export async function resolveProgramIdlsClient({
    programId,
    url,
}: ResolveProgramIdlsClientArgs): Promise<ProgramIdlPair> {
    const { resolveProgramIdls } = await import('./resolve-program-idls');
    const { anchorIdl, anchorIdlAddress, programMetadataIdl, programMetadataIdlAddress } = await resolveProgramIdls(
        createSolanaRpc(url),
        address(programId),
    );
    return {
        anchorIdl: anchorIdl as SupportedIdl | undefined,
        anchorIdlAddress,
        programMetadataIdl: programMetadataIdl as SupportedIdl | undefined,
        programMetadataIdlAddress,
    };
}
