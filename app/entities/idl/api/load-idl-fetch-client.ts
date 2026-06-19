import type { ResolveAnchorIdlClientArgs, ResolvedClientIdls, ResolveProgramIdlsClientArgs } from './idl-fetch-client';

/**
 * Lazily load the client-side IDL resolver. `idl-fetch-client` statically pulls in `@solana/idl`
 * (~45 KB gzip of yaml/toml/pako + crypto/zlib browser polyfills), so it's reached only through this
 * dynamic `import()` — keeping that weight out of the program-page bundle for the common
 * (known-cluster) path, which resolves IDLs on the server and never in the browser.
 *
 * The import above is type-only and erased at build time, so this module (which the entity barrel
 * re-exports) adds nothing to the common bundle.
 */
export async function resolveProgramIdlsClient(args: ResolveProgramIdlsClientArgs): Promise<ResolvedClientIdls> {
    const { resolveProgramIdlsClient: resolve } = await import('./idl-fetch-client');
    return resolve(args);
}

/** Anchor-only client resolver (custom/localhost), lazily loading `@solana/idl`. See above. */
export async function resolveAnchorIdlClient(args: ResolveAnchorIdlClientArgs): Promise<unknown> {
    const { resolveAnchorIdlClient: resolve } = await import('./idl-fetch-client');
    return resolve(args);
}
