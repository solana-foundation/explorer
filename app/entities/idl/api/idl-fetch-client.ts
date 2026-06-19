import { address, createSolanaRpc } from '@solana/kit';

import { Logger } from '@/app/shared/lib/logger';

import { parseIdlContent, pickPreferredVariant } from '../lib/idl-payload';
import { IdlVariant } from '../model/idl-variant';
import { type SupportedIdl } from '../model/idl-version';
import { NON_ANCHOR_PROGRAMS } from './config';
import { lastWriteSlot, resolveAnchorIdl, resolvePmpIdl } from './idl-fetch';

export type ResolveProgramIdlsClientArgs = {
    programId: string;
    /** The user-supplied RPC URL (custom cluster or localhost) to resolve directly against. */
    url: string;
    /** PMP seed (`idl`) — passed in so this entity doesn't cross-import `program-metadata`. */
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
 * Resolve only the Anchor IDL in the browser, via the same `@solana/idl` `resolveAnchorIdl` the
 * `/api/idl-latest` route uses — so custom/localhost clusters get byte-identical resolution + shape
 * validation to known clusters. Returns the parsed Anchor IDL JSON, or `undefined` for a
 * native/builtin program or one with no decodable Anchor IDL. Re-throws genuine RPC `SolanaError`s
 * so the caller (which caches via SWR) can decide whether to swallow them.
 */
export async function resolveAnchorIdlClient({ programId, url }: ResolveAnchorIdlClientArgs): Promise<unknown> {
    const programAddress = address(programId);
    // Native/builtin programs can't have an Anchor IDL — skip the PDA lookup (see NON_ANCHOR_PROGRAMS).
    if (NON_ANCHOR_PROGRAMS.has(programAddress)) return undefined;
    const anchor = await resolveAnchorIdl(createSolanaRpc(url), programAddress, {
        cluster: 'custom',
        programAddress: programId,
    });
    return anchor?.idl;
}

/**
 * Resolve a program's Anchor + PMP IDLs **in the browser** against a user-supplied RPC URL, for
 * custom / localhost clusters the server route can't reach (the server has no route to a user's
 * `localhost:8899`). Mirrors `/api/idl-latest`: the same `@solana/idl` resolvers, the same fndn
 * fallback authority for the PMP `idl` seed, and the same recency-based preferred tab — so a local
 * validator surfaces exactly what a public cluster does (including Foundation-published native IDLs).
 *
 * `@solana/idl` is heavy, so this module must only ever be reached through a dynamic `import()`
 * (see `load-idl-fetch-client.ts`) — never statically imported from the program-page bundle.
 *
 * Error policy differs from the route: there's no CDN cache to poison and no Sentry to page on the
 * client, so a single failed source degrades to `undefined` with a warning. But when *nothing*
 * resolved and a source genuinely errored, we re-throw so SWR retries instead of caching a
 * false-negative "no IDLs" for the session (e.g. a brief local-validator blip).
 */
export async function resolveProgramIdlsClient({
    programId,
    url,
    seed,
    includePmp,
}: ResolveProgramIdlsClientArgs): Promise<ResolvedClientIdls> {
    const rpc = createSolanaRpc(url);
    const programAddress = address(programId);
    const context = { cluster: 'custom', programAddress: programId };

    // Native/builtin programs can't have an Anchor IDL — skip the PDA lookup (see NON_ANCHOR_PROGRAMS).
    const skipAnchor = NON_ANCHOR_PROGRAMS.has(programAddress);

    const settled = await Promise.allSettled([
        skipAnchor ? Promise.resolve(undefined) : resolveAnchorIdl(rpc, programAddress, context),
        includePmp ? resolvePmpIdl(rpc, programAddress, seed, true) : Promise.resolve(undefined),
    ]);
    const anchor = settled[0].status === 'fulfilled' ? settled[0].value : undefined;
    const pmp = settled[1].status === 'fulfilled' ? settled[1].value : undefined;
    const rejections = settled.filter((r): r is PromiseRejectedResult => r.status === 'rejected');

    if (rejections.length > 0) {
        if (!anchor && !pmp) {
            // Nothing resolved and a source genuinely failed — re-throw so SWR retries rather than
            // caching a false-negative for the session.
            throw rejections[0].reason;
        }
        // At least one IDL resolved: a single source's failure must not hide the rest.
        for (const { reason } of rejections) {
            Logger.warn('[idl] client IDL source failed (custom/localhost RPC); served the others', {
                ...context,
                error: reason instanceof Error ? reason.message : String(reason),
            });
        }
    }

    // Best-effort recency for the default-tab decision; failures degrade silently to PMP.
    const [anchorSlot, pmpSlot] = await Promise.all([
        anchor ? lastWriteSlot(rpc, anchor.address) : undefined,
        pmp ? lastWriteSlot(rpc, pmp.address) : undefined,
    ]);

    return {
        anchorIdl: anchor?.idl as SupportedIdl | undefined,
        preferredVariant: pickPreferredVariant(Boolean(anchor), Boolean(pmp), anchorSlot, pmpSlot),
        programMetadataIdl: parseIdlContent(pmp?.content) as SupportedIdl | undefined,
    };
}
