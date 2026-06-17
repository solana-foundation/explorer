import { SignatureResult, TransactionInstruction } from '@solana/web3.js';

export type SerumIxDetailsProps<T> = {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    info: T;
    programName: string;
    innerCards?: JSX.Element[];
    childIndex?: number;
};
