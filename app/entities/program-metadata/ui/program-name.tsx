import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { RootNode } from 'codama';

import { AnchorProgramName } from '@/app/utils/anchor';

import { useProgramMetadataIdl } from '../model/use-program-metadata-idl';

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
        // PMP content may already be Codama (a RootNode) — read the program name directly.
        return <>{programNameFromIdl(programMetadataIdl as RootNode)}</>;
    } catch {
        // Otherwise it's Anchor-format: convert to a Codama RootNode first. (`rootNodeFromAnchor`'s
        // node types are version-skewed from our `codama` import, hence the bridge casts.)
        const rootNode = rootNodeFromAnchor(
            programMetadataIdl as unknown as Parameters<typeof rootNodeFromAnchor>[0],
        ) as unknown as RootNode;
        return <>{programNameFromIdl(rootNode)}</>;
    }
}

function programNameFromIdl(idl: RootNode) {
    return idl.program.name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
