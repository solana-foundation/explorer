import { getAnchorIdlsWithAccounts, useAnchorProgram } from '@entities/idl';
import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';

import { NavigationTabLink } from '@/app/shared/ui/navigation-tabs';

export function AccountDataTab({ programId }: { programId: PublicKey }) {
    const { url, cluster } = useCluster();
    const { program } = useAnchorProgram({
        cluster,
        programAddress: programId.toString(),
        select: getAnchorIdlsWithAccounts,
        url,
    });

    if (!program) {
        // eslint-disable-next-line unicorn/no-null -- a React component returns null to render nothing
        return null;
    }

    return <NavigationTabLink path="anchor-account" title="Anchor Data" />;
}
