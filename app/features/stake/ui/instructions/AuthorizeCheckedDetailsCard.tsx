import { InstructionCard } from '@components/instruction/InstructionCard';
import React from 'react';

import type { AuthorizeCheckedInfo } from '../../lib/instruction-types';
import { DetailRow, StakeProgramRow } from './DetailRow';
import type { StakeCardProps } from './types';

export function AuthorizeCheckedDetailsCard({
    ix,
    index,
    result,
    info,
    innerCards,
    childIndex,
}: StakeCardProps<AuthorizeCheckedInfo>) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Stake Program: Authorize Checked"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <StakeProgramRow />
            <DetailRow label="Stake Address" pubkey={info.stakeAccount} />
            <DetailRow label="Old Authority Address" pubkey={info.authority} />
            <DetailRow label="New Authority Address" pubkey={info.newAuthority} />
            <DetailRow label="Authority Type">{info.authorityType}</DetailRow>
            <DetailRow label="Clock Sysvar" pubkey={info.clockSysvar} />
            {info.custodian && <DetailRow label="Lockup Custodian" pubkey={info.custodian} />}
        </InstructionCard>
    );
}
