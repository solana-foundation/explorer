import { EXPLORER_BASE_URL, isEnvEnabled } from '@utils/env';

export const isReceiptEnabled = isEnvEnabled(process.env.NEXT_PUBLIC_RECEIPT_ENABLED);

export const RECEIPT_OG_IMAGE_VERSION = process.env.RECEIPT_OG_IMAGE_VERSION?.trim() ?? '';

// Empty string is valid (relative URLs), only undefined falls back to EXPLORER_BASE_URL
export const RECEIPT_BASE_URL =
    process.env.RECEIPT_BASE_URL !== undefined ? process.env.RECEIPT_BASE_URL.trim() : EXPLORER_BASE_URL;
