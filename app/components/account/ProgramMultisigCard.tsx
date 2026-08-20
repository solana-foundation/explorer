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
import { SectionCard } from '@/app/shared/ui/Card/SectionCard';
import { KeyValue, LABEL_WIDTH } from '@/app/shared/ui/key-value';

import { Address } from '../common/Address';
import { LoadingCard } from '../common/LoadingCard';

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

    const memberCount =
        squadInfo?.version === 'v4' ? squadInfo?.multisig.members.length : squadInfo?.multisig.keys.length;

    return (
        <SectionCard title="Upgrade Authority Multisig Information">
            <KeyValue label="Multisig Program" labelWidth={LABEL_WIDTH}>
                {squadMapInfo?.version === 'v4' ? 'Squads V4' : 'Squads V3'}
            </KeyValue>
            <KeyValue label="Multisig Program Id" labelWidth={LABEL_WIDTH}>
                <Address
                    pubkey={new PublicKey(squadMapInfo?.version === 'v4' ? SQUADS_V4_ADDRESS : SQUADS_V3_ADDRESS)}
                    link
                />
            </KeyValue>
            <KeyValue label="Multisig Account" labelWidth={LABEL_WIDTH}>
                {squadMapInfo?.isSquad && <Address pubkey={new PublicKey(squadMapInfo.multisig)} link />}
            </KeyValue>
            <KeyValue label="Multisig Approval Threshold" labelWidth={LABEL_WIDTH}>
                {squadInfo?.multisig.threshold}
                {' of '}
                {memberCount}
            </KeyValue>
            {members.map((member, idx) => (
                <KeyValue key={idx} label={`Multisig Member ${idx + 1}`} labelWidth={LABEL_WIDTH}>
                    <Address pubkey={member} link />
                </KeyValue>
            ))}
        </SectionCard>
    );
}
