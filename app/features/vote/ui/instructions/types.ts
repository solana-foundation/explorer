import type { ParsedInstruction, SignatureResult } from '@solana/web3.js';
import type { ReactNode } from 'react';

export type VoteCardBaseProps = {
    ix: ParsedInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: ReactNode[];
    childIndex?: number;
};

export type VoteCardProps<TInfo> = VoteCardBaseProps & { info: TInfo };
