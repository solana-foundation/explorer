import { SolBalance } from '@components/common/SolBalance';
import { InstructionCard } from '@components/instruction/InstructionCard';
import React from 'react';

import type { WithdrawInfo } from '../../lib/instruction-types';
import { DetailRow, StakeProgramRow } from './DetailRow';
import type { StakeCardProps } from './types';

export function WithdrawDetailsCard({ ix, index, result, info, innerCards, childIndex }: StakeCardProps<WithdrawInfo>) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Stake Program: Withdraw Stake"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <StakeProgramRow />
            <DetailRow label="Stake Address" pubkey={info.stakeAccount} />
            <DetailRow label="Authority Address" pubkey={info.withdrawAuthority} />
            <DetailRow label="To Address" pubkey={info.destination} />
            <DetailRow label="Withdraw Amount (SOL)">
                <SolBalance lamports={info.lamports} />
            </DetailRow>
        </InstructionCard>
    );
}
