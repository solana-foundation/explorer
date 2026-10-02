import type { SolanaRpc } from '@entities/cluster/server';
import { buildProgramName, type SupportedIdl } from '@entities/idl';
import { resolveProgramIdls } from '@entities/idl/server';
import { fetchProgramSecurityTxt } from '@entities/security-txt/server';
import { orderVerifiedEntries, TRUSTED_SIGNERS } from '@explorer/entity-inspector/verification';
import type { Address } from '@solana/kit';
import type { ServerCluster } from '@utils/cluster';
import { getOsecRegistryUrl } from '@utils/verified-builds-url';

import { Logger } from '@/app/shared/lib/logger';

import type { MarkerState } from '../model/account-share-data';

// One OSEC `/status-all` entry, narrowed to the fields the verified check reads and shape-compatible with
// the shared `orderVerifiedEntries` core.
type OsecEntry = { signer: string; is_verified: boolean; on_chain_hash: string; is_frozen?: boolean };

/**
 * The verified-build registry lookup outcome, kept as a union so a failed lookup is never confused with a
 * registry that legitimately lists no entry:
 * - `entries` - the registry answered; an empty list means the program is genuinely not registered.
 * - `none` - the cluster has no registry to consult (e.g. testnet), so verification is not possible.
 * - `unavailable` - the request failed, so the result is unknown rather than negative.
 */
export type VerifiedLookup = { kind: 'entries'; entries: OsecEntry[] } | { kind: 'none' } | { kind: 'unavailable' };

// Registry-independent signals plus the raw verified-build lookup; the caller decides `verifiedBuild` from
// that lookup and the program's hash/authority via `verifiedBuildState`. Each marker is a tri-state so a
// failed probe surfaces as `unknown` rather than a false negative.
export type ProgramProvenance = {
    idlUploaded: MarkerState;
    securityTxt: MarkerState;
    verified: VerifiedLookup;
    name?: string;
};

/**
 * The program's registry-independent signals, each probed independently and failing soft so a slow source
 * never blanks the others. Every leg is bounded by `abortSignal`: the registry fetch honours it natively,
 * and the IDL / security.txt lookups (single RPC round trips with no signal of their own) are raced against
 * it so one stalled source can never outlast the shared wall-clock budget.
 */
export async function getProgramProvenance(
    rpc: SolanaRpc,
    programId: Address,
    cluster: ServerCluster,
    abortSignal: AbortSignal,
): Promise<ProgramProvenance> {
    const [idl, securityTxt, verified] = await Promise.all([
        boundBySignal(resolveIdl(rpc, programId), abortSignal, UNKNOWN_IDL),
        boundBySignal(hasSecurityTxt(rpc, programId), abortSignal, 'unknown' as const),
        fetchVerifiedLookup(programId, cluster, abortSignal),
    ]);

    return { idlUploaded: idl.uploaded, name: idl.name, securityTxt, verified };
}

/**
 * Whether the OSEC registry proves a *current* verified build, as a tri-state. `unknown` covers every case
 * where we cannot actually assert a negative: the lookup failed, the cluster has no registry, or the local
 * hash could not be computed (an unsupported loader, or a program-data read that failed). Otherwise it
 * reuses the program page's core - only authority/trusted-signer entries count, each re-checked against the
 * freshly computed on-chain hash so a stale (post-upgrade) or spoofed entry never reads as verified.
 */
export function verifiedBuildState(
    lookup: VerifiedLookup,
    programAuthority: string | undefined,
    localHash: string | undefined,
): MarkerState {
    // A failed lookup, an unsupported/failed hash, or a cluster with no registry: we cannot verify, so we
    // must not claim the program is unverified.
    if (lookup.kind === 'unavailable' || localHash === undefined || lookup.kind === 'none') return 'unknown';

    // The registry answered and the hash is known: an empty list is a real "not registered".
    if (lookup.entries.length === 0) return 'no';

    const verified = programAuthority
        ? orderVerifiedEntries(lookup.entries, programAuthority, localHash).some(entry => entry.is_verified)
        : lookup.entries.some(
              entry =>
                  entry.is_verified &&
                  (entry.is_frozen === true || TRUSTED_SIGNERS[entry.signer] !== undefined) &&
                  entry.on_chain_hash === localHash,
          );
    return verified ? 'yes' : 'no';
}

/**
 * Resolve to `fallback` if `signal` aborts before `op` settles, so a stalled RPC round trip in a signal-less
 * lookup never blocks the shared budget. The underlying work is not cancellable, but its result is abandoned.
 */
function boundBySignal<T>(op: Promise<T>, signal: AbortSignal, fallback: T): Promise<T> {
    if (signal.aborted) return Promise.resolve(fallback);
    return new Promise<T>(resolve => {
        const finish = (value: T) => {
            signal.removeEventListener('abort', onAbort);
            resolve(value);
        };
        const onAbort = () => finish(fallback);
        signal.addEventListener('abort', onAbort);
        op.then(finish, () => finish(fallback));
    });
}

type IdlResult = { name?: string; uploaded: MarkerState };

const UNKNOWN_IDL: IdlResult = { uploaded: 'unknown' };

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
            uploaded: anchorIdl || programMetadataIdl ? 'yes' : 'no',
        };
    } catch (error) {
        // The resolver throws only on RPC failure (absent IDLs are returned as values), so a throw is a
        // transient blip - report `unknown` rather than a false "No IDL" the route would cache.
        Logger.warn('[account-share] IDL lookup failed', { cause: error instanceof Error ? error.message : error });
        return UNKNOWN_IDL;
    }
}

/** Whether the program exposes a security.txt, via the shared resolver the program page keys on. */
async function hasSecurityTxt(rpc: SolanaRpc, programId: Address): Promise<MarkerState> {
    try {
        return (await fetchProgramSecurityTxt(rpc, programId)) ? 'yes' : 'no';
    } catch (error) {
        Logger.warn('[account-share] security.txt lookup failed', {
            cause: error instanceof Error ? error.message : error,
        });
        return 'unknown';
    }
}

// The OSEC `status-all` entries for the program, validated per element so a malformed one can't hide a
// valid verified build. A cluster with no registry resolves to `none`; a failed request resolves to
// `unavailable` (not an empty list) so the caller can tell "not registered" from "could not check".
async function fetchVerifiedLookup(
    programId: Address,
    cluster: ServerCluster,
    abortSignal: AbortSignal,
): Promise<VerifiedLookup> {
    const registryUrl = getOsecRegistryUrl(cluster);
    if (!registryUrl) return { kind: 'none' };

    try {
        const response = await fetch(`${registryUrl}/status-all/${programId}`, { signal: abortSignal });
        if (!response.ok) return { kind: 'unavailable' };

        return { entries: parseVerifiedEntries(await response.json()), kind: 'entries' };
    } catch (error) {
        Logger.warn('[account-share] verified-build lookup failed', {
            cause: error instanceof Error ? error.message : error,
        });
        return { kind: 'unavailable' };
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
