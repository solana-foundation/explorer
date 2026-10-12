import type { SolanaRpc } from '@entities/cluster/server';
import { buildProgramName, type SupportedIdl } from '@entities/idl';
import { resolveProgramIdls } from '@entities/idl/server';
import { fetchProgramSecurityTxt } from '@entities/security-txt/server';
import { fetchOsecStatusAll, orderVerifiedEntries, TRUSTED_SIGNERS } from '@explorer/entity-inspector/verification';
import type { Address } from '@solana/kit';
import type { ServerCluster } from '@utils/cluster';
import { getOsecRegistryUrl } from '@utils/verified-builds-url';
import { boolean, Infer, is, optional, string, type } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';

import type { MarkerState } from '../model/account-share-data';

type OsecEntry = Infer<typeof OsecEntry>;
const OsecEntry = type({
    is_frozen: optional(boolean()),
    is_verified: boolean(),
    on_chain_hash: string(),
    signer: string(),
});

export type VerifiedLookup = { kind: 'entries'; entries: OsecEntry[] } | { kind: 'none' } | { kind: 'unavailable' };

export type ProgramProvenance = {
    idlUploaded: MarkerState;
    securityTxt: MarkerState;
    verified: VerifiedLookup;
    name?: string;
};

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

export function verifiedBuildState(
    lookup: VerifiedLookup,
    programAuthority: string | undefined,
    localHash: string | undefined,
): MarkerState {
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

async function fetchVerifiedLookup(
    programId: Address,
    cluster: ServerCluster,
    abortSignal: AbortSignal,
): Promise<VerifiedLookup> {
    const registryUrl = getOsecRegistryUrl(cluster);
    if (!registryUrl) return { kind: 'none' };

    try {
        const raw = await fetchOsecStatusAll(registryUrl, programId, abortSignal);
        return { entries: parseVerifiedEntries(raw), kind: 'entries' };
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
    return payload.filter((entry): entry is OsecEntry => is(entry, OsecEntry));
}
