import type { FormattedReceipt } from '../types';
import { generateMultiTransferPdf } from './generate-multi-transfer-pdf';
import { generateSingleTransferPdf } from './generate-single-transfer-pdf';
import { loadPdfDeps as loadPdfDepsImpl, type PdfDeps } from './pdf-shared';

export type { PdfDeps };
export const loadPdfDeps = loadPdfDepsImpl;

export type ReceiptPdfOpts = {
    signature: string;
    receiptUrl: string;
    clusterLabel: string;
    transactionUrl?: string;
    reportDate?: Date;
    usdValue?: string;
};

export async function generateReceiptPdf(
    deps: PdfDeps,
    receipt: FormattedReceipt,
    opts: ReceiptPdfOpts,
): Promise<void> {
    const isMulti = receipt.transfers && receipt.transfers.length > 1;
    return isMulti ? generateMultiTransferPdf(deps, receipt, opts) : generateSingleTransferPdf(deps, receipt, opts);
}
