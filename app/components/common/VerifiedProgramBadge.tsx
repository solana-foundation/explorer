import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';

import { useCluster } from '@/app/providers/cluster';
import { Cluster } from '@/app/utils/cluster';
import { useClusterPath } from '@/app/utils/url';
import { useIsProgramVerified } from '@/app/utils/verified-builds';
import { ProgramDataAccountInfo } from '@/app/validators/accounts/upgradeable-program';

export function VerifiedProgramBadge({
    programData,
    pubkey,
}: {
    programData: ProgramDataAccountInfo;
    pubkey: PublicKey;
}) {
    const { cluster } = useCluster();
    const {
        isLoading,
        data: isVerified,
        error,
    } = useIsProgramVerified({
        programData,
        programId: pubkey,
    });
    const verifiedBuildTabPath = useClusterPath({ pathname: `/address/${pubkey.toBase58()}/verified-build` });

    if (cluster !== Cluster.MainnetBeta) {
        return (
            <h3 className="mb-0">
                <span className="badge bg-warning-soft rank">Verified Builds only available on Mainnet</span>
            </h3>
        );
    } else if (isLoading) {
        return (
            <h3 className="mb-0">
                <span className="badge">Loading...</span>
            </h3>
        );
    } else if (error) {
        return (
            <h3 className="mb-0">
                <span className="badge bg-warning-soft rank">Error fetching verified build information</span>
            </h3>
        );
    } else {
        let badgeClass = '';
        let badgeText = '';

        if (isVerified) {
            badgeClass = 'bg-success-soft';
            badgeText = 'Program Source Verified';
        } else {
            badgeClass = 'bg-warning-soft';
            badgeText = 'Program Not Verified';
        }

        return (
            <h3 className="mb-0">
                <Link className={`c-pointer badge ${badgeClass} rank`} href={verifiedBuildTabPath}>
                    {badgeText}
                </Link>
            </h3>
        );
    }
}
