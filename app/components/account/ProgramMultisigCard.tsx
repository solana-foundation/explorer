import { useAnchorProgram } from '@entities/idl';
import { PublicKey } from '@solana/web3.js';
import { Suspense } from 'react';

import { UpgradeableLoaderAccountData } from '@/app/providers/accounts';
import { useCluster } from '@/app/providers/cluster';
import {
    SQUADS_V3_ADDRESS,
    SQUADS_V4_ADDRESS,
    useSquadsMultisig,
    useSquadsMultisigLookup,
} from '@/app/providers/squadsMultisig';
import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

import { Address } from '../common/Address';
import { LoadingCard } from '../common/LoadingCard';
import { TableCardBody } from '../common/TableCardBody';

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
    const anchorProgram = useAnchorProgram(
        squadMapInfo?.version === 'v3' ? SQUADS_V3_ADDRESS : SQUADS_V4_ADDRESS,
        url,
        cluster,
    );
    const { data: squadInfo } = useSquadsMultisig(
        anchorProgram.program,
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

    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit" className="e-flex e-items-center">
                    Upgrade Authority Multisig Information
                </CardTitle>
            </CardHeader>
            <TableCardBody>
                <BaseTable.Row>
                    <BaseTable.Cell>Multisig Program</BaseTable.Cell>
                    <BaseTable.Cell className="e-text-right">
                        {squadMapInfo?.version === 'v4' ? 'Squads V4' : 'Squads V3'}
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Multisig Program Id</BaseTable.Cell>
                    <BaseTable.Cell className="e-text-right">
                        <Address
                            pubkey={
                                new PublicKey(squadMapInfo?.version === 'v4' ? SQUADS_V4_ADDRESS : SQUADS_V3_ADDRESS)
                            }
                            alignRight
                            link
                        />
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Multisig Account</BaseTable.Cell>
                    <BaseTable.Cell className="e-text-right">
                        {squadMapInfo?.isSquad ? (
                            <Address pubkey={new PublicKey(squadMapInfo.multisig)} alignRight link />
                        ) : null}
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Multisig Approval Threshold</BaseTable.Cell>
                    <BaseTable.Cell className="e-text-right">
                        {squadInfo?.multisig.threshold}
                        {' of '}
                        {squadInfo?.version === 'v4'
                            ? squadInfo?.multisig.members.length
                            : squadInfo?.multisig.keys.length}
                    </BaseTable.Cell>
                </BaseTable.Row>
                {members.map((member, idx) => (
                    <BaseTable.Row key={idx}>
                        <BaseTable.Cell>Multisig Member {idx + 1}</BaseTable.Cell>
                        <BaseTable.Cell className="e-text-right">
                            <Address pubkey={member} alignRight link />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                ))}
            </TableCardBody>
        </Card>
    );
}
