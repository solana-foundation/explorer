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

export type FormattedReceiptToken = FormattedBaseReceipt & {
    kind: 'token';
    mint?: string | undefined;
    symbol?: string | undefined;
};

export type FormattedReceipt = (FormattedBaseReceipt & { kind: 'sol' }) | FormattedReceiptToken;

export type FormattedExtendedReceipt = FormattedReceipt & {
    confirmationStatus: string | undefined;
    senderHref?: string | undefined;
    receiverHref?: string | undefined;
    tokenHref?: string | undefined;
};

export type DownloadReceiptFn = () => Promise<void>;
