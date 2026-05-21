import { InstructionCard } from '@components/instruction/InstructionCard';
import React from 'react';

import type { DeactivateInfo } from '../../lib/instruction-types';
import { DetailRow, StakeProgramRow } from './DetailRow';
import type { StakeCardProps } from './types';

export function DeactivateDetailsCard({
    ix,
    index,
    result,
    info,
    innerCards,
    childIndex,
}: StakeCardProps<DeactivateInfo>) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Stake Program: Deactivate Stake"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <StakeProgramRow />
            <DetailRow label="Stake Address" pubkey={info.stakeAccount} />
            <DetailRow label="Authority Address" pubkey={info.stakeAuthority} />
        </InstructionCard>
    );
}
