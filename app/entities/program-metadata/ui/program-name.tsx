import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { RootNode } from 'codama';

import { AnchorProgramName } from '@/app/utils/anchor';

import { useProgramMetadataIdl } from '../model/useProgramMetadataIdl';

// FIXME: missing Storybook story — needs useProgramMetadataIdl SWR mock.
export default function ProgramName({
    programId,
    url,
    cluster,
    defaultName,
}: {
    programId: PublicKey;
    url: string;
    defaultName?: string;
    cluster: Cluster;
}) {
    const { programMetadataIdl } = useProgramMetadataIdl(programId.toString(), url, cluster, true);
    if (!programMetadataIdl) {
        return <AnchorProgramName programId={programId} url={url} cluster={cluster} defaultName={defaultName} />;
    }

    try {
        return <>{programNameFromIdl(programMetadataIdl)}</>;
    } catch {
        return <>{programNameFromIdl(rootNodeFromAnchor(programMetadataIdl) as unknown as RootNode)}</>;
    }
}

function programNameFromIdl(idl: RootNode) {
    return idl.program.name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
