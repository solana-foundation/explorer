import { Epoch } from '@components/common/Epoch';
import { InstructionCard } from '@components/instruction/InstructionCard';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import { displayTimestampUtc } from '@utils/date';
import React from 'react';

import type { InitializeInfo } from '../../lib/instruction-types';
import { DetailRow, StakeProgramRow } from './DetailRow';
import type { StakeCardProps } from './types';

export function InitializeDetailsCard({
    ix,
    index,
    result,
    info,
    innerCards,
    childIndex,
}: StakeCardProps<InitializeInfo>) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Stake Program: Initialize Stake"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <StakeProgramRow />
            <DetailRow label="Stake Address" pubkey={info.stakeAccount} />
            <DetailRow label="Stake Authority Address" pubkey={info.authorized.staker} />
            <DetailRow label="Withdraw Authority Address" pubkey={info.authorized.withdrawer} />
            {info.lockup.epoch > 0 && (
                <DetailRow label="Lockup Expiry Epoch">
                    <Epoch epoch={info.lockup.epoch} link />
                </DetailRow>
            )}
            {info.lockup.unixTimestamp > 0 && (
                <DetailRow label="Lockup Expiry Timestamp" monospace>
                    {displayTimestampUtc(info.lockup.unixTimestamp * 1000)}
                </DetailRow>
            )}
            {info.lockup.custodian !== SYSTEM_PROGRAM_ADDRESS && (
                <DetailRow label="Lockup Custodian Address" pubkey={info.lockup.custodian} />
            )}
            <DetailRow label="Rent Sysvar" pubkey={info.rentSysvar} />
        </InstructionCard>
    );
}
