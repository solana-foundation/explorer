import { Epoch } from '@components/common/Epoch';
import { InstructionCard } from '@components/instruction/InstructionCard';
import { displayTimestampUtc } from '@utils/date';
import React from 'react';

import type { SetLockupCheckedInfo, SetLockupInfo } from '../../lib/instruction-types';
import { DetailRow, StakeProgramRow } from './DetailRow';
import type { StakeCardProps } from './types';

export function SetLockupDetailsCard({
    ix,
    index,
    result,
    info,
    title,
    innerCards,
    childIndex,
}: StakeCardProps<SetLockupInfo | SetLockupCheckedInfo> & { title: string }) {
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
            <DetailRow label="Lockup Authority" pubkey={info.custodian} />
            {info.lockup.epoch !== undefined && (
                <DetailRow label="New Lockup Expiry Epoch">
                    <Epoch epoch={info.lockup.epoch} link />
                </DetailRow>
            )}
            {info.lockup.unixTimestamp !== undefined && (
                <DetailRow label="New Lockup Expiry Timestamp" monospace>
                    {displayTimestampUtc(info.lockup.unixTimestamp * 1000)}
                </DetailRow>
            )}
            {info.lockup.custodian && <DetailRow label="New Lockup Custodian" pubkey={info.lockup.custodian} />}
        </InstructionCard>
    );
}
