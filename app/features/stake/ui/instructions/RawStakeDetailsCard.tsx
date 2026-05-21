import { UnknownDetailsCard } from '@components/instruction/UnknownDetailsCard';
import type { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import React, { type ReactNode } from 'react';

import { Logger } from '@/app/shared/lib/logger';

import { classifyRawStakeInstruction } from '../../lib/classify-raw-stake-instruction';
import { GetMinimumDelegationDetailsCard } from './GetMinimumDelegationDetailsCard';

type RawStakeDetailsCardProps = {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: ReactNode[];
    childIndex?: number;
    signature?: string;
};

export function RawStakeDetailsCard(props: RawStakeDetailsCardProps) {
    // The RPC's jsonParsed parser doesn't recognise GetMinimumDelegation (and may lag
    // behind on future stake instructions) — fall back to identifying by discriminator.
    //
    // 'invalid' here means the discriminator didn't match any known stake instruction.
    const { ix, signature, ...rest } = props;
    const classification = classifyRawStakeInstruction(ix.data);
    switch (classification.kind) {
        case 'getMinimumDelegation':
            return <GetMinimumDelegationDetailsCard ix={ix} {...rest} />;
        case 'invalid':
            Logger.warn('[stake] Unrecognized stake instruction discriminator', {
                error: classification.error,
                signature,
            });
            return <UnknownDetailsCard ix={ix} {...rest} />;
        case 'unsupported':
            return <UnknownDetailsCard ix={ix} {...rest} />;
    }
}
