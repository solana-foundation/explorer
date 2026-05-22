import type { ParsedInstruction, PartiallyDecodedInstruction } from '@solana/web3.js';

export type Transfer = {
    receiver: string;
    sender: string;
    total: number;
};

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
    transfers?: Transfer[];
};

export type ReceiptToken = BaseReceipt & {
    type: 'token';
    mint: string | undefined;
    symbol: string | undefined;
    logoURI: string | undefined;
    transfers?: Transfer[];
};

export type Receipt = ReceiptSol | ReceiptToken;

export function isSolReceipt(receipt: Receipt): receipt is ReceiptSol {
    return receipt.type === 'sol';
}

export function isTokenReceipt(receipt: Receipt): receipt is ReceiptToken {
    return receipt.type === 'token';
}

export function hasTransfers(receipt: Receipt): receipt is Receipt & { transfers: Transfer[] } {
    return Boolean(receipt.transfers?.length);
}

export function isParsedInstruction(
    instruction: ParsedInstruction | PartiallyDecodedInstruction,
): instruction is ParsedInstruction {
    return 'parsed' in instruction;
}
