import { getAnchorIdlsWithAccounts, getCodamaIdlsWithAccounts, useAnchorProgram, useProgramIdls } from '@entities/idl';
import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';

import { NavigationTabLink } from '@/app/shared/ui/navigation-tabs';

export function AccountDataTab({ programId }: { programId: PublicKey }) {
    const { url, cluster } = useCluster();
    const { idls } = useProgramIdls(programId.toString(), url, cluster);
    const { program } = useAnchorProgram({
        cluster,
        programAddress: programId.toString(),
        select: getAnchorIdlsWithAccounts,
        url,
    });

    // The tab renders for a decodable Anchor program or a Codama IDL (incl. converted legacy) with accounts.
    const hasCodamaAccounts = !!idls && getCodamaIdlsWithAccounts(idls).length > 0;
    if (!program && !hasCodamaAccounts) {
        // eslint-disable-next-line unicorn/no-null -- a React component returns null to render nothing
        return null;
    }

    return <NavigationTabLink path="anchor-account" title="Anchor Data" />;
}
