import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { RootNode } from 'codama';

import { useProgramMetadataIdl } from '../providers/useProgramMetadataIdl';

export function ProgramMetadataProgramName({
    programId,
    url,
    cluster,
}: {
    programId: PublicKey;
    url: string;
    defaultName?: string;
    cluster: Cluster;
}) {
    const { programMetadataIdl } = useProgramMetadataIdl(programId.toString(), url, cluster, true);

    try {
        return <>{programNameFromIdl(programMetadataIdl)}</>;
    } catch (error) {
        return <>{programNameFromIdl(rootNodeFromAnchor(programMetadataIdl) as any as RootNode)}</>;
    }
}

function programNameFromIdl(idl: RootNode) {
    return idl.program.name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
