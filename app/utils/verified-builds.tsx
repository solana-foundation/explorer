import { sha256 } from '@noble/hashes/sha256';
import { Connection, PublicKey } from '@solana/web3.js';
import useSWRImmutable from 'swr/immutable';

import { useAnchorProgram } from '../providers/anchor';
import { useCluster } from '../providers/cluster';
import { ProgramDataAccountInfo } from '../validators/accounts/upgradeable-program';
import { Cluster } from './cluster';

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

const TRUSTED_SIGNERS: Record<string, string> = {
    '11111111111111111111111111111111': 'Explorer',
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
        { suspense: options?.suspense }
    );

    if (!programData || !registryData) {
        return { data: null, error: registryError, isLoading: isRegistryLoading };
    }

    // Only trust entries that are verified and signed by a trusted signer or the program authority
    let orderedVerifiedEntries: OsecInfo[] = [];
    if (programAuthority) {
        const trustedEntries = registryData.filter(
            entry =>
                (TRUSTED_SIGNERS[entry.signer] || entry.signer === programAuthority?.toBase58()) && entry.is_verified
        );

        // Update the verification status of the trusted entries based on the on-chain hash
        const hash = hashProgramData(programData);
        trustedEntries.forEach(entry => {
            entry.is_verified = hash === entry['on_chain_hash'];
        });

        const mappedBySigner: Record<string, OsecInfo> = {};

        // Map the registryData by signer in order to enforce hierarchy of trust
        trustedEntries.forEach(entry => {
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
        orderedVerifiedEntries = registryData
            .filter(entry => entry.is_verified && entry.is_frozen)
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
        async ([_prefix, programId, hash, authority]) => {
            if (!programId) {
                return false;
            }

            const response = await fetch(`${OSEC_REGISTRY_URL}/status/${programId}`);
            const osecInfo = (await response.json()) as OsecInfo;

            // If the program data is frozen, then we can trust the API
            if (osecInfo.is_frozen && authority === null) {
                return osecInfo.is_verified;
            }

            // Otherwise, let's just double check that the on-chain hash matches the reported hash for verification
            return osecInfo.is_verified && hash === osecInfo['on_chain_hash'];
        }
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
    const { data: orderedVerifiedEntries } = useVerifiedProgramRegistry({
        options,
        programAuthority,
        programData,
        programId,
    });

    // Get the first verified entry
    const verifiedData = orderedVerifiedEntries?.find(entry => entry.is_verified);

    return useEnrichedOsecInfo({ options, osecInfo: verifiedData, programId });
}

// Internal method to enrich the osec info with the verify command (requires fetching the on-chain PDA)
function useEnrichedOsecInfo({
    programId,
    osecInfo,
    options,
}: {
    programId: PublicKey;
    osecInfo: OsecInfo | undefined;
    options?: { suspense: boolean };
}) {
    const { url: clusterUrl, cluster: cluster } = useCluster();
    const connection = new Connection(clusterUrl);

    const { program: accountAnchorProgram } = useAnchorProgram(VERIFY_PROGRAM_ID, connection.rpcEndpoint);

    // Fetch the PDA derived from the program upgrade authority
    const {
        data: pdaData,
        error: pdaError,
        isLoading: isPdaLoading,
    } = useSWRImmutable(
        accountAnchorProgram ? `pda-${programId.toBase58()}-${osecInfo?.signer}` : null,
        async () => {
            if (!osecInfo || !accountAnchorProgram) {
                return null;
            }

            try {
                const [pda] = PublicKey.findProgramAddressSync(
                    [Buffer.from('otter_verify'), new PublicKey(osecInfo.signer).toBuffer(), programId.toBuffer()],
                    new PublicKey(VERIFY_PROGRAM_ID)
                );

                const pdaAccountInfo = await (accountAnchorProgram.account as any).buildParams.fetch(pda);
                if (!pdaAccountInfo) {
                    return null;
                }
                return pdaAccountInfo;
            } catch (error) {
                console.error('Error fetching on-chain PDA', error);
                return null;
            }
        },
        { suspense: options?.suspense }
    );

    if (!osecInfo || pdaError) {
        return { data: null, error: pdaError, isLoading: isPdaLoading };
    }
    if (!pdaData || isPdaLoading) {
        return { data: null, isLoading: isPdaLoading };
    }

    const message = TRUSTED_SIGNERS[osecInfo?.signer || '']
        ? 'Verification information provided by a trusted signer.'
        : osecInfo.is_frozen
        ? 'Verification information provided by the program deployer.'
        : 'Verification information provided by the program authority.';

    const enrichedOsecInfo: OsecRegistryInfo = {
        ...osecInfo,
        message,
        signer: osecInfo.signer || '',
        verification_status: osecInfo.is_verified
            ? VerificationStatus.Verified
            : pdaData
            ? VerificationStatus.PdaUploaded
            : VerificationStatus.NotVerified,
        verify_command: '',
    };
    enrichedOsecInfo.repo_url = pdaData.gitUrl;
    enrichedOsecInfo.repo_url += pdaData.commit.length ? '/tree/' + pdaData.commit : '';
    if (pdaData) {
        // Create command from the args of the verified build PDA
        enrichedOsecInfo.verify_command = coalesceCommandFromPda(programId, pdaData);
    } else {
        enrichedOsecInfo.verify_command = isMainnet(cluster)
            ? 'Program does not have a verify PDA uploaded.'
            : 'Verify command only available on mainnet.';
    }
    return { data: enrichedOsecInfo, isLoading: isPdaLoading };
}

function coalesceCommandFromPda(programId: PublicKey, pdaData: any) {
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
export function hashProgramData(programData: ProgramDataAccountInfo): string {
    const buffer = Buffer.from(programData.data[0], 'base64');
    // Truncate null bytes at the end of the buffer
    let truncatedBytes = 0;
    while (buffer[buffer.length - 1 - truncatedBytes] === 0) {
        truncatedBytes++;
    }
    // Hash the binary
    const c = Buffer.from(buffer.slice(0, buffer.length - truncatedBytes));
    return Buffer.from(sha256(c)).toString('hex');
}
