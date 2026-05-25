import type { FormattedReceipt } from '../types';
import { generateMultiTransferPdf } from './generate-multi-transfer-pdf';
import { generateSingleTransferPdf } from './generate-single-transfer-pdf';
import { loadPdfDeps as loadPdfDepsImpl, type PdfDeps, type ReceiptPdfOpts } from './pdf-shared';

export type { PdfDeps, ReceiptPdfOpts };
export const loadPdfDeps = loadPdfDepsImpl;

export async function generateReceiptPdf(
    deps: PdfDeps,
    receipt: FormattedReceipt,
    opts: ReceiptPdfOpts,
): Promise<void> {
    const isMulti = receipt.transfers && receipt.transfers.length > 1;
    return isMulti ? generateMultiTransferPdf(deps, receipt, opts) : generateSingleTransferPdf(deps, receipt, opts);
}
