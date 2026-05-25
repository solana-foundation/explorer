import type { ParsedInstruction, SignatureResult } from '@solana/web3.js';
import type { ReactNode } from 'react';

export type StakeCardBaseProps = {
    ix: ParsedInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: ReactNode[];
    childIndex?: number;
};

export type StakeCardProps<TInfo> = StakeCardBaseProps & { info: TInfo };
