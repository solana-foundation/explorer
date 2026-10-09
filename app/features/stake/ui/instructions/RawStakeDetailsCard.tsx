import { toInstructionNode, UnknownDetailsCard } from '@entities/instruction-card';
import type { TransactionInstruction } from '@solana/web3.js';

import { Logger } from '@/app/shared/lib/logger';

import { classifyRawStakeInstruction } from '../../lib/classify-raw-stake-instruction';
import { GetMinimumDelegationDetailsCard } from './GetMinimumDelegationDetailsCard';

type RawStakeDetailsCardProps = {
    ix: TransactionInstruction;
    index: number;
    innerCards?: JSX.Element[];
    childIndex?: number;
    signature?: string;
};

export function RawStakeDetailsCard({ ix, index, innerCards, childIndex, signature }: RawStakeDetailsCardProps) {
    const node = toInstructionNode({ childIndex, index, innerCards, ix });

    // The RPC's jsonParsed parser doesn't recognise GetMinimumDelegation (and may lag
    // behind on future stake instructions) — fall back to identifying by discriminator.
    //
    // 'invalid' here means the discriminator didn't match any known stake instruction.
    const classification = classifyRawStakeInstruction(ix.data);
    switch (classification.kind) {
        case 'getMinimumDelegation':
            return <GetMinimumDelegationDetailsCard node={node} />;
        case 'invalid':
            Logger.warn('[stake] Unrecognized stake instruction discriminator', {
                error: classification.error,
                signature,
            });
            return <UnknownDetailsCard node={node} />;
        case 'unsupported':
            return <UnknownDetailsCard node={node} />;
    }
}
