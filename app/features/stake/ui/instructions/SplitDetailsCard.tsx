import { SolBalance } from '@components/common/SolBalance';
import { InstructionCard } from '@components/instruction/InstructionCard';
import React from 'react';

import type { SplitInfo } from '../../lib/instruction-types';
import { DetailRow, StakeProgramRow } from './DetailRow';
import type { StakeCardProps } from './types';

export function SplitDetailsCard({ ix, index, result, info, innerCards, childIndex }: StakeCardProps<SplitInfo>) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Stake Program: Split Stake"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <StakeProgramRow />
            <DetailRow label="Stake Address" pubkey={info.stakeAccount} />
            <DetailRow label="Authority Address" pubkey={info.stakeAuthority} />
            <DetailRow label="New Stake Address" pubkey={info.newSplitAccount} />
            <DetailRow label="Split Amount (SOL)">
                <SolBalance lamports={info.lamports} />
            </DetailRow>
        </InstructionCard>
    );
}
