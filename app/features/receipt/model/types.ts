import type { ParsedInstruction, PartiallyDecodedInstruction } from '@solana/web3.js';

export type BaseReceipt = {
    sender: string;
    receiver: string;
    date: number;
    fee: number;
    total: number;
    memo?: string | undefined;
};

export type ReceiptSol = BaseReceipt & {
    type: 'sol';
};

export type ReceiptToken = BaseReceipt & {
    type: 'token';
    mint: string | undefined;
    symbol: string | undefined;
    logoURI: string | undefined;
};

export type Receipt = ReceiptSol | ReceiptToken;

export function isSolReceipt(receipt: Receipt): receipt is ReceiptSol {
    return receipt.type === 'sol';
}

export function isTokenReceipt(receipt: Receipt): receipt is ReceiptToken {
    return receipt.type === 'token';
}

export type SolTransferParsed = {
    type: 'transfer';
    info: {
        source?: string;
        destination?: string;
        lamports?: number;
    };
};

export function isParsedInstruction(
    instruction: ParsedInstruction | PartiallyDecodedInstruction
): instruction is ParsedInstruction {
    return 'parsed' in instruction;
}
