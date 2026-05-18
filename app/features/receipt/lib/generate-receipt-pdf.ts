import type { FormattedReceipt } from '../types';
import { generateMultiTransferPdf } from './generate-multi-transfer-pdf';
import { generateSingleTransferPdf } from './generate-single-transfer-pdf';
import { loadPdfDeps as loadPdfDepsImpl, type PdfDeps } from './pdf-shared';

export type { PdfDeps };
export const loadPdfDeps = loadPdfDepsImpl;

export async function generateReceiptPdf(
    deps: PdfDeps,
    receipt: FormattedReceipt,
    signature: string,
    receiptUrl: string,
    transactionUrl?: string,
    usdValue?: string,
): Promise<void> {
    const isMulti = receipt.transfers && receipt.transfers.length > 1;
    const generate = isMulti ? generateMultiTransferPdf : generateSingleTransferPdf;
    return generate(deps, receipt, signature, receiptUrl, transactionUrl, usdValue);
}
