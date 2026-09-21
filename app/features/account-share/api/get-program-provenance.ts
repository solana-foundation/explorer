import { resolveProgramIdls } from '@entities/idl/server';
import type { Address, Rpc, SolanaRpcApi } from '@solana/kit';
import type { ServerCluster } from '@utils/cluster';

import { Logger } from '@/app/shared/lib/logger';

import { getOsecRegistryUrl } from '../lib/constants';
import type { ProgramMarkers } from '../model/account-share-data';

type ProvenanceRpc = Rpc<SolanaRpcApi>;

/** One OSEC registry entry, narrowed to the fields the verified signal reads. */
type OsecEntry = { is_verified?: boolean };

/** The build-provenance markers, plus the program name the IDL fetch happened to surface. */
export type ProgramProvenance = { markers: ProgramMarkers; name?: string };

/**
 * The three program markers - and, for free, the program's IDL name - each resolved independently so one
 * failing check never blanks the others.
 *
 * Best-effort by design: every probe is bounded by the caller's `abortSignal` and fails soft to its
 * negative state, since a share card must render even when a registry is slow. The signals come from the
 * same sources the program page uses - `@solana/idl`, `@solana/security-txt`, and the OSEC registry.
 */
export async function getProgramProvenance(
    rpc: ProvenanceRpc,
    programId: Address,
    cluster: ServerCluster,
    abortSignal: AbortSignal,
): Promise<ProgramProvenance> {
    const [idl, securityTxt, verifiedBuild] = await Promise.all([
        resolveIdl(rpc, programId),
        hasSecurityTxt(rpc, programId),
        hasVerifiedBuild(programId, cluster, abortSignal),
    ]);

    return { markers: { idlUploaded: idl.uploaded, securityTxt, verifiedBuild }, name: idl.name };
}

type IdlResult = { name?: string; uploaded: boolean };

/** Whether an Anchor or Program-Metadata IDL is published, and the name it carries when it is. */
async function resolveIdl(rpc: ProvenanceRpc, programId: Address): Promise<IdlResult> {
    try {
        const { anchorIdl, programMetadataIdl } = await resolveProgramIdls(rpc, programId);
        return {
            name: idlName(anchorIdl) ?? idlName(programMetadataIdl),
            uploaded: Boolean(anchorIdl || programMetadataIdl),
        };
    } catch (error) {
        Logger.warn('[account-share] IDL lookup failed', { cause: error instanceof Error ? error.message : error });
        return { uploaded: false };
    }
}

/** The program's display name from an IDL's `name` (or `metadata.name`), prettified from its raw slug. */
function idlName(idl: unknown): string | undefined {
    if (!idl || typeof idl !== 'object') return undefined;
    const record = idl as { metadata?: { name?: unknown }; name?: unknown };
    const raw = pickString(record.name) ?? pickString(record.metadata?.name);
    return raw ? prettifyName(raw) : undefined;
}

function pickString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

/** "jupiter_aggregator" -> "Jupiter Aggregator": the IDL slug read as a title. */
function prettifyName(raw: string): string {
    return raw
        .replaceAll('_', ' ')
        .replaceAll('-', ' ')
        .split(' ')
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/** Whether the program exposes a security.txt (canonical PMP `security` seed, then legacy ELF section). */
async function hasSecurityTxt(rpc: ProvenanceRpc, programId: Address): Promise<boolean> {
    try {
        const { fetchSecurityTxt } = await import('@solana/security-txt');
        // eslint-disable-next-line unicorn/no-null -- library API: null = canonical-only PMP lookup.
        const result = await fetchSecurityTxt(rpc, programId, { authority: null });
        return Boolean(result);
    } catch (error) {
        Logger.warn('[account-share] security.txt lookup failed', {
            cause: error instanceof Error ? error.message : error,
        });
        return false;
    }
}

/**
 * Whether the OSEC registry reports a verified build for the program on this cluster.
 *
 * A single HTTP read of the registry's `status-all` list - the same endpoint the program page keys on.
 * It trusts the registry's own `is_verified` flag rather than re-hashing the program bytes, which an image
 * route cannot afford to download; clusters with no registry (testnet) resolve to false.
 */
async function hasVerifiedBuild(
    programId: Address,
    cluster: ServerCluster,
    abortSignal: AbortSignal,
): Promise<boolean> {
    const registryUrl = getOsecRegistryUrl(cluster);
    if (!registryUrl) return false;

    try {
        const response = await fetch(`${registryUrl}/status-all/${programId}`, { signal: abortSignal });
        if (!response.ok) return false;

        const entries = (await response.json()) as OsecEntry[];
        return Array.isArray(entries) && entries.some(entry => entry.is_verified === true);
    } catch (error) {
        Logger.warn('[account-share] verified-build lookup failed', {
            cause: error instanceof Error ? error.message : error,
        });
        return false;
    }
}
