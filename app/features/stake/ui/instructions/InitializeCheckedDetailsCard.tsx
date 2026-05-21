import { InstructionCard } from '@components/instruction/InstructionCard';
import React from 'react';

import type { InitializeCheckedInfo } from '../../lib/instruction-types';
import { DetailRow, StakeProgramRow } from './DetailRow';
import type { StakeCardProps } from './types';

export function InitializeCheckedDetailsCard({
    ix,
    index,
    result,
    info,
    innerCards,
    childIndex,
}: StakeCardProps<InitializeCheckedInfo>) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Stake Program: Initialize Checked"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <StakeProgramRow />
            <DetailRow label="Stake Address" pubkey={info.stakeAccount} />
            <DetailRow label="Stake Authority Address" pubkey={info.staker} />
            <DetailRow label="Withdraw Authority Address" pubkey={info.withdrawer} />
            <DetailRow label="Rent Sysvar" pubkey={info.rentSysvar} />
        </InstructionCard>
    );
}
