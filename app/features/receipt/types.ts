export type FormattedBaseReceipt = {
    date: {
        timestamp: number;
        utc: string;
    };
    fee: {
        raw: number;
        formatted: string;
    };
    total: {
        raw: number;
        formatted: string;
        unit: string;
    };
    network: string;
    sender: {
        address: string;
        truncated: string;
        domain?: string;
    };
    receiver: {
        address: string;
        truncated: string;
        domain?: string;
    };
    memo?: string | undefined;
    logoURI?: string | undefined;
};

export type FormattedReceiptSol = FormattedBaseReceipt;

export type FormattedReceiptToken = FormattedBaseReceipt & {
    mint?: string | undefined;
    symbol?: string | undefined;
};

export type FormattedReceipt = FormattedReceiptSol | FormattedReceiptToken;

export type FormattedExtendedReceipt = FormattedReceipt & {
    confirmationStatus: string | undefined;
    logoURI?: string | undefined;
    senderHref?: string | undefined;
    receiverHref?: string | undefined;
    tokenHref?: string | undefined;
};
