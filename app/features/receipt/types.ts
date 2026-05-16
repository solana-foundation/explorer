export type { FormattedBaseReceipt, FormattedReceipt, FormattedReceiptToken } from '@/app/entities/token-receipt';

import type { FormattedBaseReceipt, FormattedReceipt } from '@/app/entities/token-receipt';

export type TransferRow = {
    amount: FormattedBaseReceipt['total'];
    receiver: FormattedBaseReceipt['receiver'];
    receiverHref?: string;
    sender: FormattedBaseReceipt['sender'];
    senderHref?: string;
};

export type FormattedExtendedReceipt = FormattedReceipt & {
    confirmationStatus: string | undefined;
    senderHref?: string | undefined;
    receiverHref?: string | undefined;
    tokenHref?: string | undefined;
    transfers?: TransferRow[];
};

export type DownloadReceiptFn = () => Promise<void>;
