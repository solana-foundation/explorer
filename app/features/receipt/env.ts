import { isEnvEnabled } from '@utils/env';

export const isReceiptEnabled = isEnvEnabled(process.env.NEXT_PUBLIC_RECEIPT_ENABLED);

export const ogImageVersion = process.env.RECEIPT_OG_IMAGE_VERSION?.trim() ?? '';
