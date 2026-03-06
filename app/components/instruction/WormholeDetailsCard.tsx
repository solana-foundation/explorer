import { useCluster } from '@providers/cluster';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { Logger } from '@/app/shared/lib/logger';

import { InstructionCard } from './InstructionCard';
import { parsWormholeInstructionTitle } from './wormhole/types';

export function WormholeDetailsCard({
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
        title = parsWormholeInstructionTitle(ix);
    } catch (error) {
        Logger.error('[components:ix-wormhole] Failed to parse instruction title', {
            error,
            signature,
            url,
        });
    }

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title={`Wormhole: ${title || 'Unknown'}`}
            innerCards={innerCards}
            childIndex={childIndex}
            defaultRaw
        />
    );
}
