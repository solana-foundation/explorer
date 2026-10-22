import { getAnchorAccountIdls, useAnchorProgram } from '@entities/idl';
import { PublicKey } from '@solana/web3.js';
import { Suspense } from 'react';

import { Skeleton } from '@/app/components/shared/ui/skeleton';
import { UpgradeableLoaderAccountData } from '@/app/providers/accounts';
import { useCluster } from '@/app/providers/cluster';
import {
    SQUADS_V3_ADDRESS,
    SQUADS_V4_ADDRESS,
    useSquadsMultisig,
    useSquadsMultisigLookup,
} from '@/app/providers/squadsMultisig';
import { KeyValueRows } from '@/app/shared/ui/key-value';
import { OverviewCard } from '@/app/shared/ui/OverviewCard';

import { Address } from '../common/Address';
import { LoadingCard } from '../common/LoadingCard';

// The Squads program ids are static constants — decode them once at module load instead of building a
// fresh PublicKey (base58 decode + validation) on every render.
const SQUADS_V3_PUBKEY = new PublicKey(SQUADS_V3_ADDRESS);
const SQUADS_V4_PUBKEY = new PublicKey(SQUADS_V4_ADDRESS);

export function ProgramMultisigCard({ data }: { data: UpgradeableLoaderAccountData }) {
    return (
        <Suspense fallback={<LoadingCard message="Loading multisig information" />}>
            <ProgramMultisigCardInner programAuthority={data.programData?.authority} />
        </Suspense>
    );
}

function ProgramMultisigCardInner({ programAuthority }: { programAuthority: PublicKey | null | undefined }) {
    const { cluster, url } = useCluster();
    const { data: squadMapInfo } = useSquadsMultisigLookup(programAuthority, cluster);
    const squadsAddress = squadMapInfo?.version === 'v3' ? SQUADS_V3_ADDRESS : SQUADS_V4_ADDRESS;
    const { program: anchorProgram } = useAnchorProgram({
        cluster,
        programAddress: squadsAddress,
        select: getAnchorAccountIdls,
        url,
    });
    const { data: squadInfo } = useSquadsMultisig(
        anchorProgram,
        squadMapInfo?.multisig,
        cluster,
        squadMapInfo?.version,
    );

    let members: PublicKey[];
    if (squadInfo !== undefined && squadInfo?.version === 'v4') {
        members = squadInfo.multisig.members.map(obj => obj.key) ?? [];
    } else {
        members = squadInfo?.multisig.keys ?? [];
    }

    const memberCount =
        squadInfo?.version === 'v4' ? squadInfo?.multisig.members.length : squadInfo?.multisig.keys.length;

    return (
        <OverviewCard title="Upgrade Authority Multisig Information">
            <KeyValueRows
                rows={[
                    {
                        label: 'Multisig Program',
                        value: squadMapInfo?.version === 'v4' ? 'Squads V4' : 'Squads V3',
                    },
                    {
                        label: 'Multisig Program Id',
                        value: (
                            <Address
                                pubkey={squadMapInfo?.version === 'v4' ? SQUADS_V4_PUBKEY : SQUADS_V3_PUBKEY}
                                link
                            />
                        ),
                    },
                    squadMapInfo?.isSquad && {
                        label: 'Multisig Account',
                        value: <Address pubkey={new PublicKey(squadMapInfo.multisig)} link />,
                    },
                    {
                        label: 'Multisig Approval Threshold',
                        value: squadInfo ? (
                            `${squadInfo.multisig.threshold} of ${memberCount}`
                        ) : (
                            <Skeleton className="h-4 w-16" />
                        ),
                    },
                    ...members.map((member, idx) => ({
                        label: `Multisig Member ${idx + 1}`,
                        value: <Address pubkey={member} link />,
                    })),
                ]}
            />
        </OverviewCard>
    );
}
