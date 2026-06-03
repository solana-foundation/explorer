// Storybook stub for `@/app/utils/verified-builds`. The real module makes a network call
// to verify.osec.io plus a Solana RPC PDA fetch — neither is available in story environments.
// This stub re-exports the pure pieces (types, enums, hash helper) and overrides only the
// data-fetching hooks so VerifiedBuildCard can render the "Verified" visual.

import type { OsecInfo, OsecRegistryInfo } from '../../app/utils/verified-builds';

export {
    hashProgramData,
    useIsProgramVerified,
    useVerifiedProgramRegistry,
    VerificationStatus,
} from '../../app/utils/verified-builds';
export type { OsecInfo, OsecRegistryInfo };

import { VerificationStatus } from '../../app/utils/verified-builds';

const MOCK_VERIFIED: OsecRegistryInfo = {
    executable_hash: '0000000000000000000000000000000000000000000000000000000000000000',
    is_verified: true,
    last_verified_at: '2026-01-01T00:00:00.000Z',
    message: 'Verification information provided by a trusted signer.',
    on_chain_hash: '0000000000000000000000000000000000000000000000000000000000000000',
    repo_url: 'https://github.com/example/verified-program',
    signer: '5vJwnLeyjV8uNJSp1zn7VLW8GwiQbcsQbGaVSwRmkE4r',
    verification_status: VerificationStatus.Verified,
    verify_command:
        'solana-verify verify-from-repo -um --program-id TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA https://github.com/example/verified-program --commit-hash abc1234',
};

export function useVerifiedProgram(): { data: OsecRegistryInfo | null; isLoading: boolean } {
    return { data: MOCK_VERIFIED, isLoading: false };
}
