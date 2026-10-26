import { convertAnchorToCodama, IdlVariant, useProgramIdls } from '@entities/idl/@x/program-metadata';
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
    const { idls } = useProgramIdls(programId.toString(), url, cluster, { suspense: true });
    if (!idls) return <>{defaultName}</>;
    const selected = idls.at(0);
    if (!selected || selected.source === IdlVariant.Anchor) {
        return <AnchorProgramName programId={programId} url={url} cluster={cluster} defaultName={defaultName} />;
    }

    const rootNode = selected.standard === 'Codama' ? selected.idl : convertAnchorToCodama(selected.idl);
    if (!rootNode) {
        return <AnchorProgramName programId={programId} url={url} cluster={cluster} defaultName={defaultName} />;
    }
    return <>{programNameFromIdl(rootNode)}</>;
}

function programNameFromIdl(idl: RootNode) {
    return idl.program.name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
