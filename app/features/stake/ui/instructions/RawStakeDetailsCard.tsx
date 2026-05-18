import { UnknownDetailsCard } from '@components/instruction/UnknownDetailsCard';
import type { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import { identifyStakeInstruction, StakeInstruction } from '@solana-program/stake';
import React, { type ReactNode } from 'react';

import { Logger } from '@/app/shared/lib/logger';

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
    // TODO: drop this try/catch once `InstructionCard` gains a React error boundary.
    // identifyStakeInstruction() throws on data that doesn't match a known discriminator,
    // and try/catch in render conflates that with downstream render errors. Same cleanup
    // applies to StakeDetailsCard and the ~15 other program cards using this pattern —
    // see the TODO at the top of StakeDetailsCard.tsx for the full rationale.
    const { ix, signature, ...rest } = props;
    try {
        const instructionType = identifyStakeInstruction(ix.data);
        switch (instructionType) {
            case StakeInstruction.GetMinimumDelegation:
                return <GetMinimumDelegationDetailsCard ix={ix} {...rest} />;
            default:
                return <UnknownDetailsCard ix={ix} {...rest} />;
        }
    } catch (error) {
        Logger.error(error, { signature });
        return <UnknownDetailsCard ix={ix} {...rest} />;
    }
}
