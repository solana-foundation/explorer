import { InstructionCard } from '@components/instruction/InstructionCard';
import React from 'react';

import type { MergeInfo } from '../../lib/instruction-types';
import { DetailRow, StakeProgramRow } from './DetailRow';
import type { StakeCardProps } from './types';

export function MergeDetailsCard({ ix, index, result, info, innerCards, childIndex }: StakeCardProps<MergeInfo>) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Stake Program: Merge Stake"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <StakeProgramRow />
            <DetailRow label="Stake Source" pubkey={info.source} />
            <DetailRow label="Stake Destination" pubkey={info.destination} />
            <DetailRow label="Authority Address" pubkey={info.stakeAuthority} />
            {info.clockSysvar && <DetailRow label="Clock Sysvar" pubkey={info.clockSysvar} />}
            {info.stakeHistorySysvar && <DetailRow label="Stake History Sysvar" pubkey={info.stakeHistorySysvar} />}
        </InstructionCard>
    );
}
