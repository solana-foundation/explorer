import { getFirstAnchorIdlWithAccounts, useAnchorProgram, useProgramIdls } from '@entities/idl';
import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';

import { NavigationTabLink } from '@/app/shared/ui/navigation-tabs';

// AnchorAccountCard reads the same IDL, so a shown tab never opens a card that cannot decode.
export function AccountDataTab({ programId }: { programId: PublicKey }) {
    const { url, cluster } = useCluster();
    const { candidates } = useProgramIdls(programId.toString(), url, cluster);
    const program = useAnchorProgram(
        candidates && getFirstAnchorIdlWithAccounts(candidates),
        programId.toString(),
        url,
    );

    if (!program) {
        // eslint-disable-next-line unicorn/no-null -- a React component returns null to render nothing
        return null;
    }

    return <NavigationTabLink path="anchor-account" title="Anchor Data" />;
}
