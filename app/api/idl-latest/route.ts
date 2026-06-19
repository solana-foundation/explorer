import { clusterFromParam } from '@entities/cluster/server';
import { isTransientRpcError } from '@solana/idl';
import { type Address, address, createSolanaRpc } from '@solana/kit';
import { NextResponse } from 'next/server';

import {
    IdlVariant,
    lastWriteSlot,
    NON_ANCHOR_PROGRAMS,
    parseIdlContent,
    pickPreferredVariant,
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
 * The single IDL-resolution endpoint for known clusters, backed by `@solana/idl`: the Anchor IDL
 * and the PMP IDL (`idl` seed, with fndn fallback authority — that's how native program IDLs
 * surface), plus their last-write recency so the card can pick a default tab. The PMP content can be
 * either an Anchor or a Codama IDL — format detection is the client's concern.
 *
 * Source selection via query flags: default = both; `pmp=0` = Anchor only (the program IDL card's
 * Anchor tab, the transaction inspector's `useAnchorProgram`); `anchor=0` = PMP only (program name,
 * instruction labels via `useProgramMetadataIdl`). Recency lookups run only when *both* sources are
 * present (the only case where the preferred tab is ambiguous), so single-source requests stay cheap.
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
    // Source flags (see header): both default on; `pmp=0` = Anchor only, `anchor=0` = PMP only.
    const includePmp = searchParams.get('pmp') !== '0';
    const includeAnchor = searchParams.get('anchor') !== '0';

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

    // Skip the Anchor PDA lookup when the caller opted out (`anchor=0`) or for native/builtin programs
    // — they definitionally have no Anchor IDL, and some RPCs (SIMD-296) return transient errors
    // instead of `null` for the derived PDA (see the Sentry-panic note on NON_ANCHOR_PROGRAMS).
    const skipAnchor = !includeAnchor || NON_ANCHOR_PROGRAMS.has(programId);

    try {
        const rpc = createSolanaRpc(url);

        const settled = await Promise.allSettled([
            skipAnchor ? Promise.resolve(undefined) : resolveAnchorIdl(rpc, programId, context),
            includePmp ? resolvePmpIdl(rpc, programId, IDL_SEED, true) : Promise.resolve(undefined),
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
                if (isTransientRpcError(reason)) {
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

        // Recency only breaks a tie between two present sources — skip the lookups otherwise (so
        // single-source `pmp=0` / `anchor=0` requests spend no extra getSignaturesForAddress calls).
        let anchorSlot: bigint | undefined;
        let pmpSlot: bigint | undefined;
        if (anchor && pmp) {
            [anchorSlot, pmpSlot] = await Promise.all([
                lastWriteSlot(rpc, anchor.address),
                lastWriteSlot(rpc, pmp.address),
            ]);
        }

        const idls: ProgramIdlsPayload = {
            anchor: anchor?.idl,
            preferred: pickPreferredVariant(Boolean(anchor), Boolean(pmp), anchorSlot, pmpSlot),
            programMetadata: parseIdlContent(pmp?.content),
        };
        return NextResponse.json({ idls }, { headers: CACHE_HEADERS, status: 200 });
    } catch (error) {
        // The resolve helpers swallow "absent" and undecodable outcomes; only genuine RPC failures
        // reach here. Transient blips → retryable 502 (uncached) without paging; persistent
        // misconfiguration / unexpected errors → Sentry page.
        if (isTransientRpcError(error)) {
            Logger.warn('[api:idl-latest] RPC error resolving program IDLs', {
                ...context,
                rpcError: error instanceof Error ? error.message : String(error),
            });
            return NextResponse.json({ error: 'Upstream RPC error' }, { status: 502 });
        }
        Logger.panic(new Error('[api:idl-latest] Failed to resolve program IDLs', { cause: error }), {
            sentryExtras: context,
        });
        return NextResponse.json({ error: 'Failed to resolve IDLs' }, { status: 502 });
    }
}
