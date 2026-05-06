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
    transfers?: Array<{
        amount: { formatted: string; raw: number; unit: string };
        receiver: { address: string; truncated: string };
        sender: { address: string; truncated: string };
    }>;
};

export type FormattedReceiptToken = FormattedBaseReceipt & {
    kind: 'token';
    mint?: string | undefined;
    symbol?: string | undefined;
};

export type FormattedReceipt = (FormattedBaseReceipt & { kind: 'sol' }) | FormattedReceiptToken;
