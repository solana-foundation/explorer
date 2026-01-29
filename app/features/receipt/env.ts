import { isEnvEnabled } from '@utils/env';

export const isReceiptEnabled = isEnvEnabled(process.env.NEXT_PUBLIC_RECEIPT_ENABLED);
