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

    // The tab renders for a modern Anchor program, or a legacy Anchor IDL (now a Codama root) that declares
    // accounts. Gate the Codama check on `legacyAnchorIdl` — the marker of an Anchor IDL the resolver
    // converted (served through either the Anchor PDA or Program Metadata). A native Codama IDL (System,
    // Token, …) also declares account types but carries no `legacyAnchorIdl`, and production shows no tab.
    const hasConvertedAnchorAccounts = !!idls && getCodamaIdlsWithAccounts(idls).some(idl => !!idl.legacyAnchorIdl);
    if (!program && !hasConvertedAnchorAccounts) {
        // eslint-disable-next-line unicorn/no-null -- a React component returns null to render nothing
        return null;
    }

    return <NavigationTabLink path="anchor-account" title="Anchor Data" />;
}
