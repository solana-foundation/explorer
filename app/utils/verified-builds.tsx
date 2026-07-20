import { useAnchorProgram } from '@entities/idl';
import { sha256 } from '@noble/hashes/sha256';
import { Connection, PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';

import { fromBase64, fromUtf8, toHex } from '@/app/shared/lib/bytes';
import { Logger } from '@/app/shared/lib/logger';

import { useCluster } from '../providers/cluster';
import { ProgramBufferAccountInfo, ProgramDataAccountInfo } from '../validators/accounts/upgradeable-program';
import { Cluster } from './cluster';
import { composeOnchainRepoUrl, normalizeRepoUrl, safeRepoUrl } from './verified-builds-url';

const OSEC_REGISTRY_URL = 'https://verify.osec.io';
const VERIFY_PROGRAM_ID = 'verifycLy8mB96wd9wqq3WDXQwM4oU6r42Th37Db9fC';

export enum VerificationStatus {
    Verified = 'Verified Build',
    PdaUploaded = 'Not verified Build',
    NotVerified = 'Not Verified',
}

export type OsecRegistryInfo = {
    verification_status: VerificationStatus;
    signer: string;
    is_verified: boolean;
    message: string;
    on_chain_hash: string;
    executable_hash: string;
    last_verified_at: string | null;
    repo_url: string;
    onchain_repo_url: string;
    verify_command: string;
};

export type OsecInfo = {
    signer: string;
    is_verified: boolean;
    on_chain_hash: string;
    executable_hash: string;
    repo_url: string;
    commit: string;
    last_verified_at: string;
    is_frozen: boolean;
};

// Decoded subset of the Otter Verify `BuildParams` account used to compose the verify command / repo URL.
type OtterVerifyBuildParams = {
    gitUrl: string;
    commit: string;
    args?: string[];
};

function parsePublicKey(value: string | undefined): PublicKey | null {
    if (!value) return null;
    try {
        return new PublicKey(value);
    } catch {
        return null;
    }
}

const TRUSTED_SIGNERS: Record<string, string> = {
    '11111111111111111111111111111111': 'Explorer',
    '5vJwnLeyjV8uNJSp1zn7VLW8GwiQbcsQbGaVSwRmkE4r': 'Foundation',
    '9VWiUUhgNoRwTH5NVehYJEDwcotwYX3VgW4MChiHPAqU': 'OtterSecurity',
    CyJj5ejJAUveDXnLduJbkvwjxcmWJNqCuB9DR7AExrHn: 'Explorer',
};

export function useVerifiedProgramRegistry({
    programId,
    programAuthority,
    options,
    programData,
}: {
    programId: PublicKey;
    programAuthority: PublicKey | null;
    options?: { suspense: boolean };
    programData?: ProgramDataAccountInfo;
}) {
    const {
        data: registryData,
        error: registryError,
        isLoading: isRegistryLoading,
    } = useSWRImmutable(
        `${programId.toBase58()}`,
        async (programId: string) => {
            const response = await fetch(`${OSEC_REGISTRY_URL}/status-all/${programId}`);

            return response.json() as Promise<OsecInfo[]>;
        },
        { suspense: options?.suspense },
    );

    if (!programData || !registryData) {
        return { data: null, error: registryError, isLoading: isRegistryLoading };
    }

    // Only trust entries that are verified and signed by a trusted signer or the program authority
    let orderedVerifiedEntries: OsecInfo[] = [];
    if (programAuthority) {
        const trustedEntries = registryData.filter(
            entry =>
                (TRUSTED_SIGNERS[entry.signer] || entry.signer === programAuthority?.toBase58()) && entry.is_verified,
        );

        // Re-validate the on-chain hash locally (the registry's is_verified flag may be stale)
        const hash = hashProgramData(programData);
        const validatedEntries = trustedEntries.map(entry => ({
            ...entry,
            is_verified: hash === entry['on_chain_hash'],
        }));

        const mappedBySigner: Record<string, OsecInfo> = {};

        // Map the registryData by signer in order to enforce hierarchy of trust
        validatedEntries.forEach(entry => {
            mappedBySigner[entry.signer] = entry;
        });

        // Get the program authority's entry first, then the trusted signers
        const hierarchy = [...(programAuthority ? [programAuthority.toBase58()] : []), ...Object.keys(TRUSTED_SIGNERS)];
        for (const signer of hierarchy) {
            if (mappedBySigner[signer]) {
                orderedVerifiedEntries.push(mappedBySigner[signer]);
            }
        }
    } else {
        // Program is immutable (no authority) — trust verified entries from
        // frozen programs or trusted signers. Since immutable programs cannot
        // be changed, verification from any trusted source remains valid.
        const trustedEntries = registryData.filter(
            entry => entry.is_verified && (entry.is_frozen || TRUSTED_SIGNERS[entry.signer]),
        );

        // Re-validate against on-chain data since the registry's is_verified flag may be stale
        const hash = hashProgramData(programData);
        orderedVerifiedEntries = trustedEntries
            .map(entry => ({ ...entry, is_verified: hash === entry['on_chain_hash'] }))
            .filter(entry => entry.is_verified)
            .sort((a, b) => new Date(a.last_verified_at).getTime() - new Date(b.last_verified_at).getTime());
    }

    return { data: orderedVerifiedEntries, isLoading: isRegistryLoading };
}

export function useIsProgramVerified({
    programId,
    programData,
}: {
    programId: PublicKey;
    programData: ProgramDataAccountInfo;
}) {
    return useSWRImmutable(
        ['is-program-verified', programId.toBase58(), hashProgramData(programData), programData.authority],
        async ([_prefix, programId, hash]) => {
            if (!programId) {
                return false;
            }

            const response = await fetch(`${OSEC_REGISTRY_URL}/status/${programId}`);
            const osecInfo = (await response.json()) as OsecInfo;

            // Cross-check the on-chain hash to stay consistent with useVerifiedProgramRegistry
            return osecInfo.is_verified && hash === osecInfo['on_chain_hash'];
        },
    );
}

// Method to fetch verified build information for a given program
// Returns the first verified entry that is signed by the program authority or a trusted signer
export function useVerifiedProgram({
    programId,
    programAuthority,
    options,
    programData,
}: {
    programId: PublicKey;
    programAuthority: PublicKey | null;
    options?: { suspense: boolean };
    programData?: ProgramDataAccountInfo;
}) {
    const { data: orderedVerifiedEntries, isLoading: isRegistryLoading } = useVerifiedProgramRegistry({
        options,
        programAuthority,
        programData,
        programId,
    });

    // Get the first verified entry
    const verifiedData = orderedVerifiedEntries?.find(entry => entry.is_verified);

    const enriched = useEnrichedOsecInfo({ options, osecInfo: verifiedData, programAuthority, programId });

    // Keep surfacing the loading state while the registry (`/status-all`) is still in flight, so the card
    // renders a spinner instead of prematurely falling through to the "not uploaded" empty state.
    return { ...enriched, isLoading: isRegistryLoading || enriched.isLoading };
}

// Internal method to enrich the osec info with the verify command (requires fetching the on-chain PDA)
function useEnrichedOsecInfo({
    programId,
    osecInfo,
    options,
    programAuthority,
}: {
    programId: PublicKey;
    osecInfo: OsecInfo | undefined;
    options?: { suspense: boolean };
    programAuthority: PublicKey | null;
}) {
    const { url: clusterUrl, cluster: cluster } = useCluster();
    const connection = new Connection(clusterUrl);

    const { program: accountAnchorProgram, isLoading: isIdlLoading } = useAnchorProgram(
        VERIFY_PROGRAM_ID,
        connection.rpcEndpoint,
    );
    const signerAuthorities = useMemo(
        () =>
            Array.from(
                new Map(
                    [
                        programAuthority,
                        parsePublicKey(osecInfo?.signer),
                        ...Object.keys(TRUSTED_SIGNERS).map(parsePublicKey),
                    ]
                        .filter((key): key is PublicKey => key !== null)
                        .map(key => [key.toBase58(), key]),
                ).values(),
            ),
        [programAuthority, osecInfo?.signer],
    );

    // Fetch the PDA derived from the program upgrade authority
    const {
        data: pdaData,
        error: pdaError,
        isLoading: isPdaLoading,
    } = useSWRImmutable(
        accountAnchorProgram && osecInfo && signerAuthorities.length > 0
            ? `pda-${programId.toBase58()}-${signerAuthorities.map(x => x.toBase58()).join(',')}`
            : null,
        async () => {
            if (!osecInfo || !accountAnchorProgram) {
                return null;
            }

            for (const pdaSeedAuthority of signerAuthorities) {
                const [pda] = PublicKey.findProgramAddressSync(
                    [fromUtf8('otter_verify'), pdaSeedAuthority.toBytes(), programId.toBytes()],
                    new PublicKey(VERIFY_PROGRAM_ID),
                );
                try {
                    const pdaAccountInfo = await (accountAnchorProgram.account as any).buildParams.fetch(pda);
                    if (pdaAccountInfo) {
                        return pdaAccountInfo;
                    }
                } catch (error: unknown) {
                    // Expected: most signer candidates won't have a matching PDA
                    Logger.debug('[utils:verified-builds] No matching PDA for signer candidate', {
                        error,
                    });
                }
            }
            return null;
        },
        { suspense: options?.suspense },
    );

    // No verified entry from the registry — surface nothing so the card shows the empty state.
    if (!osecInfo) {
        return { data: null, isLoading: false };
    }

    // The Otter Verify PDA — and the verify-program IDL needed to decode it — only enrich the card with
    // the verify command and on-chain repo URL; they are NOT required to know the program is verified
    // (OSEC + the on-chain hash re-check already establish that). Stay in the loading state while that
    // resolution is in flight so a verified program never flashes the "not uploaded" empty state, then
    // render from OSEC data whether or not the PDA resolved. A `pdaError` means every signer
    // candidate failed to fetch, which is the same "no PDA" degrade path.
    if (isIdlLoading || isPdaLoading) {
        return { data: null, isLoading: true };
    }

    return {
        data: buildEnrichedOsecInfo({ cluster, osecInfo, pdaData: pdaError ? null : (pdaData ?? null), programId }),
        isLoading: false,
    };
}

// Build the display model from the OSEC registry entry, enriching with the on-chain Otter Verify PDA
// when available. The PDA supplies the verify command and on-chain repo URL; without it we fall back to
// the OSEC-reported repo URL and a placeholder command so a verified program still renders its status.
export function buildEnrichedOsecInfo({
    cluster,
    programId,
    osecInfo,
    pdaData,
}: {
    cluster: Cluster;
    programId: PublicKey;
    osecInfo: OsecInfo;
    pdaData: OtterVerifyBuildParams | null;
}): OsecRegistryInfo {
    const message = TRUSTED_SIGNERS[osecInfo.signer]
        ? 'Verification information provided by a trusted signer.'
        : osecInfo.is_frozen
          ? 'Verification information provided by the program deployer.'
          : 'Verification information provided by the program authority.';

    const { repo_url, signer, is_verified, ...rest } = osecInfo;
    const osecRepoUrl = safeRepoUrl(normalizeRepoUrl(repo_url)) ?? '';

    return {
        ...rest,
        is_verified,
        message,
        onchain_repo_url: pdaData
            ? (composeOnchainRepoUrl(pdaData.gitUrl, pdaData.commit) ?? osecRepoUrl)
            : osecRepoUrl,
        repo_url: osecRepoUrl,
        signer: signer || '',
        verification_status: is_verified
            ? VerificationStatus.Verified
            : pdaData
              ? VerificationStatus.PdaUploaded
              : VerificationStatus.NotVerified,
        verify_command: pdaData
            ? coalesceCommandFromPda(programId, pdaData)
            : isMainnet(cluster)
              ? 'Program does not have a verify PDA uploaded.'
              : 'Verify command only available on mainnet.',
    };
}

function coalesceCommandFromPda(programId: PublicKey, pdaData: OtterVerifyBuildParams) {
    let verify_command = `solana-verify verify-from-repo -um --program-id ${programId.toBase58()} ${pdaData.gitUrl}`;

    if (pdaData.commit) {
        verify_command += ` --commit-hash ${pdaData.commit}`;
    }

    // Add additional args if available, for example mount-path and --library-name
    if (pdaData.args && pdaData.args.length > 0) {
        const argsString = pdaData.args.join(' ');
        verify_command += ` ${argsString}`;
    }
    return verify_command;
}

function isMainnet(currentCluster: Cluster): boolean {
    return currentCluster == Cluster.MainnetBeta;
}

// Helper function to hash program data
/**
 * Compute the solana-verify-style hash of an upgradeable BPF loader buffer account,
 * matching `solana-verify get-buffer-hash` / `get_binary_hash`: sha256 of the program
 * bytes with trailing zero padding removed. The RPC's jsonParsed buffer `data` is already
 * the bytes past the 37-byte buffer header. Returns undefined when `data` is unavailable.
 */
export function hashProgramBuffer(buffer: ProgramBufferAccountInfo): string | undefined {
    if (!buffer.data) return undefined;
    const bytes = fromBase64(buffer.data[0]);
    // Same RPC quirk as hashProgramData: when authority is None the parsed `data` carries the
    // 32-byte pubkey from the (Option) header, so skip it to match solana-verify's raw offset.
    const offset = buffer.authority === null ? 32 : 0;
    const data = bytes.slice(offset);
    let truncatedBytes = 0;
    while (truncatedBytes < data.length && data[data.length - 1 - truncatedBytes] === 0) {
        truncatedBytes++;
    }
    return toHex(sha256(data.slice(0, data.length - truncatedBytes)));
}

export function hashProgramData(programData: ProgramDataAccountInfo): string {
    const buffer = fromBase64(programData.data[0]);
    // The jsonParsed RPC response includes the 32-byte pubkey field from the raw
    // account header when authority is None (may contain stale data from a previous
    // authority). Skip them so the hash matches what solana-verify computes from
    // raw account data at the fixed 45-byte offset.
    const offset = programData.authority === null ? 32 : 0;
    const data = buffer.slice(offset);
    // Truncate null bytes at the end of the buffer
    let truncatedBytes = 0;
    while (truncatedBytes < data.length && data[data.length - 1 - truncatedBytes] === 0) {
        truncatedBytes++;
    }
    // Hash the binary
    const dataToHash = data.slice(0, data.length - truncatedBytes);
    return toHex(sha256(dataToHash));
}
