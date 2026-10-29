import { type RawInstructionNode, useInstructionSurface } from '@entities/instruction-card';
import type { ReactNode } from 'react';

import { Logger } from '@/app/shared/lib/logger';

import { classifyRawStakeInstruction } from '../../lib/classify-raw-stake-instruction';
import { GetMinimumDelegationDetailsCard } from './GetMinimumDelegationDetailsCard';

type RawStakeDetailsCardProps = {
    node: RawInstructionNode;
    /** The card for a stake instruction that this card cannot decode. */
    fallback: ReactNode;
};

export function RawStakeDetailsCard({ node, fallback }: RawStakeDetailsCardProps) {
    const { signature } = useInstructionSurface();

    // The RPC's jsonParsed parser doesn't recognise GetMinimumDelegation (and may lag
    // behind on future stake instructions) — fall back to identifying by discriminator.
    //
    // 'invalid' here means the discriminator didn't match any known stake instruction.
    const classification = classifyRawStakeInstruction(node.raw.data);
    switch (classification.kind) {
        case 'getMinimumDelegation':
            return <GetMinimumDelegationDetailsCard node={node} />;
        case 'invalid':
            Logger.warn('[stake] Unrecognized stake instruction discriminator', {
                error: classification.error,
                signature,
            });
            return <>{fallback}</>;
        case 'unsupported':
            return <>{fallback}</>;
    }
}
