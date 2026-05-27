import { InstructionCard } from '@components/instruction/InstructionCard';
import React from 'react';

import type { DeactivateDelinquentInfo } from '../../lib/instruction-types';
import { DetailRow, StakeProgramRow } from './DetailRow';
import type { StakeCardProps } from './types';

export function DeactivateDelinquentDetailsCard({
    ix,
    index,
    result,
    info,
    innerCards,
    childIndex,
}: StakeCardProps<DeactivateDelinquentInfo>) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Stake Program: Deactivate Delinquent"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <StakeProgramRow />
            <DetailRow label="Stake Address" pubkey={info.stakeAccount} />
            <DetailRow label="Delinquent Vote Account" pubkey={info.voteAccount} />
            <DetailRow label="Reference Vote Account" pubkey={info.referenceVoteAccount} />
        </InstructionCard>
    );
}
