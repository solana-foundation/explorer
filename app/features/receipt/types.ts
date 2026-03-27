export type { FormattedBaseReceipt, FormattedReceipt, FormattedReceiptToken } from '@/app/entities/token-receipt';

import type { FormattedReceipt } from '@/app/entities/token-receipt';

export type FormattedExtendedReceipt = FormattedReceipt & {
    confirmationStatus: string | undefined;
    senderHref?: string | undefined;
    receiverHref?: string | undefined;
    tokenHref?: string | undefined;
};

export type DownloadReceiptFn = () => Promise<void>;
