import { InstructionCard } from '@components/instruction/InstructionCard';
import React from 'react';

import { StakeProgramRow } from './DetailRow';
import type { StakeCardBaseProps } from './types';

export function GetMinimumDelegationDetailsCard({
    ix,
    index,
    result,
    innerCards,
    childIndex,
}: StakeCardBaseProps) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Stake Program: Get Minimum Delegation"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <StakeProgramRow />
        </InstructionCard>
    );
}
