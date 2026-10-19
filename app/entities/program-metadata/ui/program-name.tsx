import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { type AnchorIdl, useProgramIdls } from '@entities/idl/@x/program-metadata';
import { PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { RootNode } from 'codama';

import { AnchorProgramName } from '@/app/utils/anchor';

// FIXME: missing Storybook story. The story needs a useProgramIdls SWR mock and a custom IDL store.
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
    const { candidates } = useProgramIdls(programId.toString(), url, cluster, { suspense: true });
    if (!candidates) return <>{defaultName}</>;
    const candidate = candidates.at(0);
    if (!candidate || candidate.source === 'anchor') {
        return <AnchorProgramName programId={programId} url={url} cluster={cluster} defaultName={defaultName} />;
    }

    const rootNode = candidate.standard === 'Codama' ? candidate.idl : convertAnchorIdl(candidate.idl);
    if (!rootNode) {
        return <AnchorProgramName programId={programId} url={url} cluster={cluster} defaultName={defaultName} />;
    }
    return <>{programNameFromIdl(rootNode)}</>;
}

// The decoder accepts an Anchor IDL that builds an Anchor program even when Codama cannot convert it.
function convertAnchorIdl(idl: AnchorIdl): RootNode | undefined {
    try {
        // `rootNodeFromAnchor`'s node types are version-skewed from our `codama` import, hence the bridge casts.
        return rootNodeFromAnchor(idl as unknown as Parameters<typeof rootNodeFromAnchor>[0]) as unknown as RootNode;
    } catch {
        return undefined;
    }
}

function programNameFromIdl(idl: RootNode) {
    return idl.program.name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
