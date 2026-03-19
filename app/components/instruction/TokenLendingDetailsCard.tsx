import { useCluster } from '@providers/cluster';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { Logger } from '@/app/shared/lib/logger';

import { InstructionCard } from './InstructionCard';
import { parseTokenLendingInstructionTitle } from './token-lending/types';

export function TokenLendingDetailsCard({
    ix,
    index,
    result,
    signature,
    innerCards,
    childIndex,
}: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    signature: string;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { url } = useCluster();

    let title;
    try {
        title = parseTokenLendingInstructionTitle(ix);
    } catch (error) {
        Logger.error(error, {
            signature,
            url,
        });
    }

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title={`Token Lending: ${title || 'Unknown'}`}
            innerCards={innerCards}
            childIndex={childIndex}
            defaultRaw
        />
    );
}
