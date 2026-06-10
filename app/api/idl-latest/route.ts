import { clusterFromParam } from '@entities/cluster/server';
import { type Address, address, createSolanaRpc, isSolanaError } from '@solana/kit';
import { NextResponse } from 'next/server';

import {
    classifySolanaError,
    IdlVariant,
    lastWriteSlot,
    NON_ANCHOR_PROGRAMS,
    resolveAnchorIdl,
    resolvePmpIdl,
} from '@/app/entities/idl/server';
import { IDL_SEED } from '@/app/entities/program-metadata/server';
import { Logger } from '@/app/shared/lib/logger';
import { serverClusterUrl } from '@/app/utils/cluster';

const CACHE_DURATION = 30 * 60; // 30 minutes

const CACHE_HEADERS = {
    'Cache-Control': `public, max-age=${CACHE_DURATION}, s-maxage=${CACHE_DURATION}, stale-while-revalidate=60`,
};

type ProgramIdlsPayload = {
    anchor: unknown;
    programMetadata: unknown;
    preferred: IdlVariant;
};

/**
 * Single endpoint that resolves every IDL the program IDL card renders for a known cluster: the
 * Anchor IDL and the PMP IDL (`idl` seed, with fndn fallback authority — that's how native program
 * IDLs surface), plus their last-write recency so the card can pick a default tab. The PMP content
 * can be either an Anchor or a Codama IDL — format detection is the client's concern. Collapses
 * what used to be multiple client fetches + a bespoke last-transaction-date comparison into one
 * request. @solana/idl is server-only, hence the route.
 *
 * Each source is resolved independently (`Promise.allSettled`): a source that's absent or
 * undecodable yields `undefined`, and a *genuine RPC error* in one source no longer discards the
 * others — if at least one IDL resolved we serve it (logging/paging the failed source) instead of
 * failing the whole request. Only when nothing resolved *and* a source errored do we short-circuit
 * to a retryable 502, so we never cache a false-negative "no IDLs" for everyone.
 *
 * Native/builtin programs (`NON_ANCHOR_PROGRAMS`) skip the Anchor PDA lookup entirely: they cannot
 * have an Anchor IDL, and some RPCs (notably SIMD-296) return transient JSON-RPC errors instead of
 * `null` for the derived PDA, which would otherwise page Sentry on the very native programs whose
 * Foundation-published IDLs this route surfaces via the fndn fallback authority.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const clusterProp = searchParams.get('cluster');
    const programAddress = searchParams.get('programAddress');
    // The card skips PMP entirely when the feature flag is off; let the client opt out so we
    // don't spend RPC on PMP lookups it will discard.
    const includePmp = searchParams.get('pmp') !== '0';

    if (!programAddress || !clusterProp) {
        return NextResponse.json({ error: 'Invalid query params' }, { status: 400 });
    }

    const cluster = clusterFromParam(clusterProp);
    const url = cluster !== undefined ? serverClusterUrl(cluster, '') : undefined;
    if (!url) {
        return NextResponse.json({ error: 'Invalid cluster' }, { status: 400 });
    }

    let programId: Address;
    try {
        programId = address(programAddress);
    } catch {
        return NextResponse.json({ error: 'Invalid program address' }, { status: 400 });
    }

    const context = { cluster: clusterProp, programAddress };

    // Native/builtin programs definitionally have no Anchor IDL — never derive + getAccountInfo on
    // the IDL PDA for them (see the SIMD-296 Sentry-panic note on NON_ANCHOR_PROGRAMS).
    const skipAnchor = NON_ANCHOR_PROGRAMS.has(programId);

    try {
        const rpc = createSolanaRpc(url);

        if (!includePmp) {
            const anchor = skipAnchor ? undefined : await resolveAnchorIdl(rpc, programId, context);
            const idls: ProgramIdlsPayload = {
                anchor: anchor?.idl,
                preferred: IdlVariant.Anchor,
                programMetadata: undefined,
            };
            return NextResponse.json({ idls }, { headers: CACHE_HEADERS, status: 200 });
        }

        const settled = await Promise.allSettled([
            skipAnchor ? Promise.resolve(undefined) : resolveAnchorIdl(rpc, programId, context),
            resolvePmpIdl(rpc, programId, IDL_SEED, true),
        ]);
        const anchor = settled[0].status === 'fulfilled' ? settled[0].value : undefined;
        const pmp = settled[1].status === 'fulfilled' ? settled[1].value : undefined;
        const rejections = settled.filter((r): r is PromiseRejectedResult => r.status === 'rejected');

        if (rejections.length > 0) {
            if (!anchor && !pmp) {
                // Nothing resolved and a source genuinely failed: re-throw so the shared catch returns
                // a retryable 502 (transient) or pages (misconfig) — never cache a false-negative.
                throw rejections[0].reason;
            }
            // At least one IDL resolved. A single source's RPC failure (transient blip or persistent
            // misconfig) must not hide the sources that did resolve — log/page it but serve what we have.
            for (const { reason } of rejections) {
                if (isSolanaError(reason) && classifySolanaError(reason) === 'transient') {
                    Logger.warn('[api:idl-latest] one IDL source had a transient RPC error (served the others)', {
                        ...context,
                        rpcError: reason.message,
                    });
                } else {
                    Logger.panic(
                        new Error('[api:idl-latest] one IDL source failed (served the others)', { cause: reason }),
                        {
                            sentryExtras: context,
                        },
                    );
                }
            }
        }

        // Best-effort recency for the default-tab decision; failures degrade silently to PMP.
        const [anchorSlot, pmpSlot] = await Promise.all([
            anchor ? lastWriteSlot(rpc, anchor.address) : undefined,
            pmp ? lastWriteSlot(rpc, pmp.address) : undefined,
        ]);

        const idls: ProgramIdlsPayload = {
            anchor: anchor?.idl,
            preferred: pickPreferred(Boolean(anchor), Boolean(pmp), anchorSlot, pmpSlot),
            programMetadata: parseIdlContent(pmp?.content),
        };
        return NextResponse.json({ idls }, { headers: CACHE_HEADERS, status: 200 });
    } catch (error) {
        // The resolve helpers swallow "absent" and undecodable outcomes; only genuine RPC failures
        // reach here. Transient blips → retryable 502 (uncached) without paging; persistent
        // misconfiguration / unexpected errors → Sentry page.
        if (isSolanaError(error) && classifySolanaError(error) === 'transient') {
            Logger.warn('[api:idl-latest] RPC error resolving program IDLs', { ...context, rpcError: error.message });
            return NextResponse.json({ error: 'Upstream RPC error' }, { status: 502 });
        }
        Logger.panic(new Error('[api:idl-latest] Failed to resolve program IDLs', { cause: error }), {
            sentryExtras: context,
        });
        return NextResponse.json({ error: 'Failed to resolve IDLs' }, { status: 502 });
    }
}

function parseIdlContent(content?: string): unknown {
    if (!content) return undefined;
    try {
        // `?? undefined` because JSON.parse can yield null (on-chain content "null"); the payload
        // contract is "absent IDL → key omitted", and NextResponse.json drops undefined keys.
        return JSON.parse(content) ?? undefined;
    } catch {
        return undefined;
    }
}

// Prefer whichever source was written to chain more recently; tie / unknown → PMP (newer standard),
// matching the previous client-side behavior.
function pickPreferred(
    hasAnchor: boolean,
    hasPmp: boolean,
    anchorSlot: bigint | undefined,
    pmpSlot: bigint | undefined,
): IdlVariant {
    if (hasAnchor && !hasPmp) return IdlVariant.Anchor;
    if (!hasAnchor) return IdlVariant.ProgramMetadata;

    // Both IDLs exist — mirror the old useIdlLastTransactionDate recency comparison exactly:
    // both slots known → newer wins (tie → PMP); only the Anchor slot known → Anchor; otherwise PMP.
    if (anchorSlot !== undefined && pmpSlot !== undefined) {
        return anchorSlot > pmpSlot ? IdlVariant.Anchor : IdlVariant.ProgramMetadata;
    }
    if (anchorSlot !== undefined) return IdlVariant.Anchor;
    return IdlVariant.ProgramMetadata;
}
