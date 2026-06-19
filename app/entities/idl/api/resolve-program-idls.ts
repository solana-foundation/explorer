import { fetchAnchorIdl, fetchPmpIdl, type IdlResult, type PmpIdlResult, unwrapIdl } from '@solana/idl';
import { type Address, type Rpc, type SolanaRpcApi } from '@solana/kit';

import { IdlVariant } from '../model/idl-variant';
import { NON_ANCHOR_PROGRAMS } from './config';

// `createSolanaRpc(url)` produces this; the @solana/idl helpers accept its narrower `SolanaRpcClient`.
type IdlRpc = Rpc<SolanaRpcApi>;

export type ResolveProgramIdlsOptions = {
    /** Resolve the Anchor IDL account (skipped for native/builtin programs regardless). */
    includeAnchor: boolean;
    /** Resolve the PMP `idl`-seed IDL (canonical + fndn fallback authorities). */
    includePmp: boolean;
    /** PMP seed — passed in so this entity doesn't cross-import `program-metadata`. Unused when `includePmp` is false. */
    seed?: string;
};

export type ResolvedProgramIdls = {
    /** Parsed Anchor IDL JSON, or `undefined` when absent/undecodable/not IDL-shaped. */
    anchorIdl: unknown;
    /** Parsed PMP IDL JSON, or `undefined` when absent/undecodable. */
    programMetadataIdl: unknown;
    /** Which tab the card shows first, from on-chain write recency (tie / unknown → PMP). */
    preferredVariant: IdlVariant;
    /**
     * RPC failures from per-source resolution when *at least one* source still resolved — the caller
     * decides how to surface them (warn vs. page vs. swallow). When *nothing* resolved and a source
     * errored, this throws instead, so the caller returns a retryable error rather than caching a
     * false-negative "no IDLs".
     */
    rejections: unknown[];
};

const ANCHOR = 0;
const PMP = 1;

/**
 * Resolve a program's Anchor + PMP `idl`-seed IDLs and the preferred default tab, backed entirely by
 * `@solana/idl` (`fetchAnchorIdl` / `fetchPmpIdl` + `unwrapIdl`). This is the single orchestration
 * shared by the `/api/idl-latest` route (server) and the custom/localhost client resolver — so known
 * and custom clusters resolve byte-identically. Pure over its `rpc` handle (no logging / HTTP /
 * caching); the caller owns error policy via the returned `rejections` and any thrown RPC error.
 *
 * Each source resolves independently (`Promise.allSettled`): an absent/undecodable source is
 * `undefined`, and one source's RPC failure never discards the other. Native/builtin programs skip
 * the Anchor PDA lookup — they can't have an Anchor IDL, and some RPCs (notably SIMD-296) return
 * transient errors instead of `null` for the derived PDA. Recency lookups run only when *both*
 * sources resolved (the sole case where the default tab is ambiguous), so single-source requests
 * spend no extra `getSignaturesForAddress` calls.
 */
export async function resolveProgramIdls(
    rpc: IdlRpc,
    programId: Address,
    { includeAnchor, includePmp, seed }: ResolveProgramIdlsOptions,
): Promise<ResolvedProgramIdls> {
    const skipAnchor = !includeAnchor || NON_ANCHOR_PROGRAMS.has(programId);

    const settled = await Promise.allSettled([
        skipAnchor ? undefined : fetchAnchorIdl(rpc, programId),
        // `authority` omitted → canonical + the fndn fallback authorities (how native-program IDLs surface).
        includePmp ? fetchPmpIdl(rpc, programId, { seed }) : undefined,
    ]);

    const anchor = settled[ANCHOR].status === 'fulfilled' ? unwrapAnchor(settled[ANCHOR].value) : undefined;
    const pmp = settled[PMP].status === 'fulfilled' ? unwrapPmp(settled[PMP].value) : undefined;
    const rejections = settled.filter((r): r is PromiseRejectedResult => r.status === 'rejected').map(r => r.reason);

    if (rejections.length > 0 && !anchor && !pmp) {
        // Nothing resolved and a source genuinely failed: throw so the caller returns a retryable
        // error (transient 502 / SWR retry) instead of caching a false-negative "no IDLs".
        throw rejections[0];
    }

    // Recency only breaks a tie between two present sources — skip the lookups otherwise.
    let anchorSlot: bigint | undefined;
    let pmpSlot: bigint | undefined;
    if (anchor && pmp) {
        [anchorSlot, pmpSlot] = await Promise.all([
            lastWriteSlot(rpc, anchor.address),
            lastWriteSlot(rpc, pmp.address),
        ]);
    }

    return {
        anchorIdl: anchor?.idl,
        preferredVariant: pickPreferredVariant(Boolean(anchor), Boolean(pmp), anchorSlot, pmpSlot),
        programMetadataIdl: pmp?.idl,
        rejections,
    };
}

type ResolvedSource = { idl: unknown; address: Address };

function unwrapAnchor(result: IdlResult<'anchor'> | undefined): ResolvedSource | undefined {
    if (!result) return undefined;
    const idl = unwrapIdl(result);
    // `unwrapIdl` accepts any JSON object; keep the Anchor shape guard (top-level `instructions`
    // array) so a non-IDL object parked at the PDA isn't served/cached as a valid Anchor IDL.
    if (!idl || !Array.isArray((idl.idl as { instructions?: unknown }).instructions)) return undefined;
    return { address: idl.address, idl: idl.idl };
}

function unwrapPmp(result: PmpIdlResult | undefined): ResolvedSource | undefined {
    if (!result) return undefined;
    const idl = unwrapIdl(result);
    return idl ? { address: idl.address, idl: idl.idl } : undefined;
}

/**
 * Most-recent on-chain write slot for an account, or `undefined` when it has no signatures or the
 * lookup fails. Slot recency is best-effort tab-ordering metadata, so failures degrade silently.
 */
async function lastWriteSlot(rpc: IdlRpc, account: Address): Promise<bigint | undefined> {
    try {
        const signatures = await rpc.getSignaturesForAddress(account, { limit: 1 }).send();
        return signatures[0]?.slot ?? undefined;
    } catch {
        return undefined;
    }
}

/**
 * Pick the IDL tab to show first from on-chain write recency: prefer whichever source was written to
 * chain more recently; tie / unknown → PMP (the newer standard). Both slots known → newer wins (tie →
 * PMP); only the Anchor slot known → Anchor; otherwise PMP.
 */
function pickPreferredVariant(hasAnchor: boolean, hasPmp: boolean, anchorSlot?: bigint, pmpSlot?: bigint): IdlVariant {
    if (hasAnchor && !hasPmp) return IdlVariant.Anchor;
    if (!hasAnchor) return IdlVariant.ProgramMetadata;
    if (anchorSlot !== undefined && pmpSlot !== undefined) {
        return anchorSlot > pmpSlot ? IdlVariant.Anchor : IdlVariant.ProgramMetadata;
    }
    if (anchorSlot !== undefined) return IdlVariant.Anchor;
    return IdlVariant.ProgramMetadata;
}
