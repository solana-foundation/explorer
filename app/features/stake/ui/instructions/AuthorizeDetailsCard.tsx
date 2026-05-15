import { InstructionCard } from '@components/instruction/InstructionCard';
import React from 'react';

import type { AuthorizeInfo } from '../../lib/instruction-types';
import { DetailRow, StakeProgramRow } from './DetailRow';
import type { StakeCardProps } from './types';

export function AuthorizeDetailsCard({
    ix,
    index,
    result,
    info,
    innerCards,
    childIndex,
}: StakeCardProps<AuthorizeInfo>) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Stake Program: Authorize"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <StakeProgramRow />
            <DetailRow label="Stake Address" pubkey={info.stakeAccount} />
            <DetailRow label="Old Authority Address" pubkey={info.authority} />
            <DetailRow label="New Authority Address" pubkey={info.newAuthority} />
            <DetailRow label="Authority Type">{info.authorityType}</DetailRow>
        </InstructionCard>
    );
}
