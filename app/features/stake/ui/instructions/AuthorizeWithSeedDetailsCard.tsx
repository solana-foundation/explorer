import { InstructionCard } from '@components/instruction/InstructionCard';
import React from 'react';

import type { AuthorizeCheckedWithSeedInfo, AuthorizeWithSeedInfo } from '../../lib/instruction-types';
import { DetailRow, StakeProgramRow } from './DetailRow';
import type { StakeCardProps } from './types';

export function AuthorizeWithSeedDetailsCard({
    ix,
    index,
    result,
    info,
    title,
    innerCards,
    childIndex,
}: StakeCardProps<AuthorizeWithSeedInfo | AuthorizeCheckedWithSeedInfo> & { title: string }) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title={title}
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <StakeProgramRow />
            <DetailRow label="Stake Address" pubkey={info.stakeAccount} />
            <DetailRow label="Authority Base" pubkey={info.authorityBase} />
            <DetailRow label="Authority Owner" pubkey={info.authorityOwner} />
            <DetailRow label="Authority Seed" monospace>
                {info.authoritySeed}
            </DetailRow>
            <DetailRow label="New Authority Address" pubkey={info.newAuthorized} />
            <DetailRow label="Authority Type">{info.authorityType}</DetailRow>
            {info.clockSysvar && <DetailRow label="Clock Sysvar" pubkey={info.clockSysvar} />}
            {info.custodian && <DetailRow label="Lockup Custodian" pubkey={info.custodian} />}
        </InstructionCard>
    );
}
