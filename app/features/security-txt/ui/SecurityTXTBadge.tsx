import { PublicKey } from '@solana/web3.js';
import { useClusterPath } from '@utils/url';
import { ProgramDataAccountInfo } from '@validators/accounts/upgradeable-program';
import Link from 'next/link';

import { Badge } from '@/app/components/shared/ui/badge';
import { useProgramMetadataSecurityTxt } from '@/app/entities/program-metadata';
import { useCluster } from '@/app/providers/cluster';
import { CardTitle } from '@/app/shared/ui/Card';

import { fromProgramData } from '../lib/fromProgramData';

// FIXME: missing Storybook story — needs useProgramMetadataSecurityTxt SWR mock + useCluster (pure SecurityTXTBadge is already covered).
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
            <CardTitle as="h3" ui="dashkit">
                <Badge ui="dashkit" variant="warning">
                    {error}
                </Badge>
            </CardTitle>
        );
    }

    return (
        <CardTitle as="h3" ui="dashkit">
            <Badge ui="dashkit" variant="success" className="cursor-pointer" asChild>
                <Link href={tabPath}>Included</Link>
            </Badge>
        </CardTitle>
    );
}
