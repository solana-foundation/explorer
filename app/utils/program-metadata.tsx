import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { RootNode } from 'codama';

import { useProgramMetadataIdl } from '../providers/useProgramMetadataIdl';
import { programNameFromIdl } from '../components/instruction/codama/getProgramMetadataIdl';

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
    if (!programMetadataIdl) return null;

    try {
        return <>{programNameFromIdl(programMetadataIdl)}</>;
    } catch (error) {
        return <>{programNameFromIdl(rootNodeFromAnchor(programMetadataIdl) as any as RootNode)}</>;
    }
}
