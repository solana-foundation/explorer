import { SolBalance } from '@components/common/SolBalance';
import { InstructionCard } from '@components/instruction/InstructionCard';
import React from 'react';

import type { MoveLamportsInfo, MoveStakeInfo } from '../../lib/instruction-types';
import { DetailRow, StakeProgramRow } from './DetailRow';
import type { StakeCardProps } from './types';

type MoveVariant = 'stake' | 'lamports';

const VARIANTS: Record<MoveVariant, { destinationLabel: string; sourceLabel: string; title: string }> = {
    lamports: {
        destinationLabel: 'Destination',
        sourceLabel: 'Source',
        title: 'Stake Program: Move Lamports',
    },
    stake: {
        destinationLabel: 'Stake Destination',
        sourceLabel: 'Stake Source',
        title: 'Stake Program: Move Stake',
    },
};

export function MoveDetailsCard({
    ix,
    index,
    result,
    info,
    variant,
    innerCards,
    childIndex,
}: StakeCardProps<MoveStakeInfo | MoveLamportsInfo> & { variant: MoveVariant }) {
    const labels = VARIANTS[variant];
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title={labels.title}
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <StakeProgramRow />
            <DetailRow label={labels.sourceLabel} pubkey={info.source} />
            <DetailRow label={labels.destinationLabel} pubkey={info.destination} />
            <DetailRow label="Authority Address" pubkey={info.stakeAuthority} />
            <DetailRow label="Move Amount (SOL)">
                <SolBalance lamports={info.lamports} />
            </DetailRow>
        </InstructionCard>
    );
}
