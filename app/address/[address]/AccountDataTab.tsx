import { getIdlSpecType, useAnchorProgram } from '@entities/idl';
import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import type { RootNode } from 'codama';

import { useProgramMetadataIdl } from '@/app/entities/program-metadata';
import { NavigationTabLink } from '@/app/shared/ui/navigation-tabs';

// Show the Anchor Data tab when the program exposes an Anchor-format interface — a legacy Anchor IDL,
// or an Anchor-format IDL published through the Program Metadata Program — with at least one decodable
// account type. An Anchor 0.30+ IDL defaults `accounts: []`, so an empty array must NOT show the tab
// (the card inside can only decode named account types and would otherwise show a decode error).
export function AccountDataTab({ programId }: { programId: PublicKey }) {
    const { url, cluster } = useCluster();
    const { program: accountAnchorProgram, idl } = useAnchorProgram(programId.toString(), url, cluster);
    const { programMetadataIdl } = useProgramMetadataIdl(programId.toString(), url, cluster);

    // Codama IDLs (incl. converted legacy IDLs, from either the Anchor PDA or PMP slot) keep their
    // account types under `program.accounts`.
    const hasCodamaAccounts = (candidate: unknown) =>
        !!candidate &&
        getIdlSpecType(candidate) === 'codama' &&
        ((candidate as RootNode).program.accounts?.length ?? 0) > 0;
    // A modern Anchor-format PMP IDL with at least one account type (0.30+ defaults to `accounts: []`).
    const hasPmpAnchorAccounts =
        !!programMetadataIdl &&
        getIdlSpecType(programMetadataIdl) !== 'codama' &&
        ((programMetadataIdl as { accounts?: unknown[] }).accounts?.length ?? 0) > 0;
    if (
        !accountAnchorProgram &&
        !hasPmpAnchorAccounts &&
        !hasCodamaAccounts(idl) &&
        !hasCodamaAccounts(programMetadataIdl)
    ) {
        // eslint-disable-next-line unicorn/no-null -- a React component returns null to render nothing
        return null;
    }

    return <NavigationTabLink path="anchor-account" title="Anchor Data" />;
}
