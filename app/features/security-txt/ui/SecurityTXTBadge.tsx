import { PublicKey } from '@solana/web3.js';
import { useClusterPath } from '@utils/url';
import { ProgramDataAccountInfo } from '@validators/accounts/upgradeable-program';
import Link from 'next/link';

import { useProgramMetadataSecurityTxt } from '@/app/entities/program-metadata';
import { useCluster } from '@/app/providers/cluster';

import { fromProgramData } from '../lib/fromProgramData';

export function ProgramSecurityTXTBadge({
    programData,
    programPubkey,
}: {
    programData: ProgramDataAccountInfo;
    programPubkey: PublicKey;
}) {
    const { securityTXT, error } = fromProgramData(programData);
    const securityTabPath = useClusterPath({ pathname: `/address/${programPubkey.toBase58()}/security` });

    const { url, cluster } = useCluster();
    const { programMetadataSecurityTxt } = useProgramMetadataSecurityTxt(programPubkey.toBase58(), url, cluster);

    const maybeError = securityTXT || programMetadataSecurityTxt ? undefined : error;

    return <SecurityTXTBadge error={maybeError} tabPath={securityTabPath} />;
}

export function SecurityTXTBadge({ error, tabPath }: { error?: string; tabPath: string }) {
    if (error) {
        return (
            <h3 className="mb-0">
                <span className="badge bg-warning-soft rank">{error}</span>
            </h3>
        );
    }

    return (
        <h3 className="mb-0">
            <Link className="c-pointer badge bg-success-soft rank" href={tabPath}>
                Included
            </Link>
        </h3>
    );
}
