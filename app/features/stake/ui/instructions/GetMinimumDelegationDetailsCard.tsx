import { InstructionCard } from '@components/instruction/InstructionCard';
import type { ParsedInstruction, SignatureResult, TransactionInstruction } from '@solana/web3.js';
import React, { type ReactNode } from 'react';

import { StakeProgramRow } from './DetailRow';

type GetMinimumDelegationDetailsCardProps = {
    ix: ParsedInstruction | TransactionInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: ReactNode[];
    childIndex?: number;
};

export function GetMinimumDelegationDetailsCard({
    ix,
    index,
    result,
    innerCards,
    childIndex,
}: GetMinimumDelegationDetailsCardProps) {
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
