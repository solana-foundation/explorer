import { useCluster } from '@providers/cluster';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import Logger from '@utils/logger';
import React from 'react';

import { InstructionCard } from './InstructionCard';
import { parseTokenSwapInstructionTitle } from './token-swap/types';

export function TokenSwapDetailsCard({
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
        title = parseTokenSwapInstructionTitle(ix);
    } catch (error) {
        Logger.error(error, { signature, url });
    }

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title={`Token Swap: ${title || 'Unknown'}`}
            innerCards={innerCards}
            childIndex={childIndex}
            defaultRaw
        />
    );
}
