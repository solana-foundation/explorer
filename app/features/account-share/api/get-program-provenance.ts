import type { SolanaRpc } from '@entities/cluster/server';
import { buildProgramName, type SupportedIdl } from '@entities/idl';
import { resolveProgramIdls } from '@entities/idl/server';
import { fetchProgramSecurityTxt } from '@entities/security-txt/server';
import { orderVerifiedEntries, TRUSTED_SIGNERS } from '@explorer/entity-inspector/verification';
import type { Address } from '@solana/kit';
import type { ServerCluster } from '@utils/cluster';
import { getOsecRegistryUrl } from '@utils/verified-builds-url';

import { Logger } from '@/app/shared/lib/logger';

// One OSEC `/status-all` entry, narrowed to the fields the verified check reads and shape-compatible with
// the shared `orderVerifiedEntries` core.
type OsecEntry = { signer: string; is_verified: boolean; on_chain_hash: string; is_frozen?: boolean };

// Registry-independent signals plus the raw OSEC entries; the caller decides `verifiedBuild` from those
// entries and the program's hash/authority via `isVerifiedBuild`.
export type ProgramProvenance = {
    idlUploaded: boolean;
    securityTxt: boolean;
    verifiedEntries: OsecEntry[];
    name?: string;
};

/**
 * The program's registry-independent signals, each probed independently and failing soft so a slow source
 * never blanks the others. Only the registry fetch takes `abortSignal`; the IDL and security.txt lookups are
 * single RPC round trips with no signal.
 */
export async function getProgramProvenance(
    rpc: SolanaRpc,
    programId: Address,
    cluster: ServerCluster,
    abortSignal: AbortSignal,
): Promise<ProgramProvenance> {
    const [idl, securityTxt, verifiedEntries] = await Promise.all([
        resolveIdl(rpc, programId),
        hasSecurityTxt(rpc, programId),
        fetchVerifiedEntries(programId, cluster, abortSignal),
    ]);

    return { idlUploaded: idl.uploaded, name: idl.name, securityTxt, verifiedEntries };
}

/**
 * Whether the OSEC registry proves a *current* verified build. Reuses the program page's core: only
 * authority/trusted-signer entries count, and each is re-checked against the freshly computed on-chain hash
 * so a stale (post-upgrade) or spoofed entry never reads as verified. An immutable program can't drift, so
 * a frozen/trusted entry whose hash still matches is accepted directly.
 */
export function isVerifiedBuild(
    entries: OsecEntry[],
    programAuthority: string | undefined,
    localHash: string | undefined,
): boolean {
    if (!localHash || entries.length === 0) return false;

    if (programAuthority) {
        return orderVerifiedEntries(entries, programAuthority, localHash).some(entry => entry.is_verified);
    }

    return entries.some(
        entry =>
            entry.is_verified &&
            (entry.is_frozen === true || TRUSTED_SIGNERS[entry.signer] !== undefined) &&
            entry.on_chain_hash === localHash,
    );
}

type IdlResult = { name?: string; uploaded: boolean };

/** Whether an Anchor or Program-Metadata IDL is published, and the name it carries when it is. */
async function resolveIdl(rpc: SolanaRpc, programId: Address): Promise<IdlResult> {
    try {
        const { anchorIdl, programMetadataIdl } = await resolveProgramIdls(rpc, programId);
        return {
            // Same preference order and title-casing the program header uses.
            name: buildProgramName([
                programMetadataIdl as SupportedIdl | undefined,
                anchorIdl as SupportedIdl | undefined,
            ]),
            uploaded: Boolean(anchorIdl || programMetadataIdl),
        };
    } catch (error) {
        Logger.warn('[account-share] IDL lookup failed', { cause: error instanceof Error ? error.message : error });
        return { uploaded: false };
    }
}

/** Whether the program exposes a security.txt, via the shared resolver the program page keys on. */
async function hasSecurityTxt(rpc: SolanaRpc, programId: Address): Promise<boolean> {
    try {
        return Boolean(await fetchProgramSecurityTxt(rpc, programId));
    } catch (error) {
        Logger.warn('[account-share] security.txt lookup failed', {
            cause: error instanceof Error ? error.message : error,
        });
        return false;
    }
}

// The OSEC `status-all` entries for the program, validated per element so a malformed one can't hide a
// valid verified build. Clusters with no registry (testnet) resolve to none.
async function fetchVerifiedEntries(
    programId: Address,
    cluster: ServerCluster,
    abortSignal: AbortSignal,
): Promise<OsecEntry[]> {
    const registryUrl = getOsecRegistryUrl(cluster);
    if (!registryUrl) return [];

    try {
        const response = await fetch(`${registryUrl}/status-all/${programId}`, { signal: abortSignal });
        if (!response.ok) return [];

        return parseVerifiedEntries(await response.json());
    } catch (error) {
        Logger.warn('[account-share] verified-build lookup failed', {
            cause: error instanceof Error ? error.message : error,
        });
        return [];
    }
}

/** Keep only well-formed registry entries, so a null or retyped element never breaks the verified check. */
function parseVerifiedEntries(payload: unknown): OsecEntry[] {
    if (!Array.isArray(payload)) return [];
    return payload.filter(
        (entry): entry is OsecEntry =>
            entry !== null &&
            typeof entry === 'object' &&
            typeof (entry as OsecEntry).signer === 'string' &&
            typeof (entry as OsecEntry).is_verified === 'boolean' &&
            typeof (entry as OsecEntry).on_chain_hash === 'string',
    );
}
