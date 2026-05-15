import { InstructionCard } from '@components/instruction/InstructionCard';
import React from 'react';

import type { DelegateInfo } from '../../lib/instruction-types';
import { DetailRow, StakeProgramRow } from './DetailRow';
import type { StakeCardProps } from './types';

export function DelegateDetailsCard({
    ix,
    index,
    result,
    info,
    innerCards,
    childIndex,
}: StakeCardProps<DelegateInfo>) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Stake Program: Delegate Stake"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <StakeProgramRow />
            <DetailRow label="Stake Address" pubkey={info.stakeAccount} />
            <DetailRow label="Delegated Vote Address" pubkey={info.voteAccount} />
            <DetailRow label="Authority Address" pubkey={info.stakeAuthority} />
        </InstructionCard>
    );
}
