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
