import type { FormattedReceipt } from '../types';
import { applyTextStyle, GRID, TEXT_STYLES } from './generate-receipt-pdf-styles';
import {
    addSectionGap,
    DETAIL_ROW_GAP,
    DETAILS_COL1_X,
    DETAILS_COL2_X,
    drawDetailCell,
    drawJupiterEquivalentCaption,
    drawMemoCell,
    drawPageFooter,
    drawSectionTitle,
    drawSignatureCell,
    drawSupplierAndItems,
    initReceiptDoc,
    LINE_HEIGHT_RATIO,
    type PdfDeps,
    type ReceiptPdfOpts,
} from './pdf-shared';

// Extra room reserved inside the Amount USD cell for the Jupiter caption line.
const USD_CAPTION_RESERVE = 6;

function formatReportDateUtc(date: Date): string {
    const parts = new Intl.DateTimeFormat('en-US', {
        day: '2-digit',
        hour: '2-digit',
        hour12: false,
        minute: '2-digit',
        month: 'short',
        second: '2-digit',
        timeZone: 'UTC',
        year: 'numeric',
    }).formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value ?? '';
    return `${get('month')} ${get('day')}, ${get('year')} at ${get('hour')}:${get('minute')}:${get('second')} UTC`;
}

export async function generateSingleTransferPdf(
    deps: PdfDeps,
    receipt: FormattedReceipt,
    opts: ReceiptPdfOpts,
): Promise<void> {
    const { signature, receiptUrl, transactionUrl, usdValue } = opts;
    const { doc, y: initialY } = initReceiptDoc(deps, opts.clusterLabel);
    let y = initialY;

    y = addSectionGap(y);
    y = drawSectionTitle(doc, 'Transaction details', y);

    // Row 1: Payment date | Network fee
    const dateBottom = drawDetailCell(
        doc,
        'Payment date',
        [receipt.date.utc],
        DETAILS_COL1_X,
        y,
        TEXT_STYLES.valueMono,
    );
    const feeBottom = drawDetailCell(
        doc,
        'Network fee',
        [`${receipt.fee.formatted} SOL`],
        DETAILS_COL2_X,
        y,
        TEXT_STYLES.valueMono,
    );
    y = Math.max(dateBottom, feeBottom) + DETAIL_ROW_GAP;

    // Row 2: Sender | Amount
    applyTextStyle(doc, TEXT_STYLES.valueMono);
    const senderLines = doc.splitTextToSize(receipt.sender.address, GRID.col.innerWidth) as string[];
    const senderBottom = drawDetailCell(doc, 'Sender', senderLines, DETAILS_COL1_X, y, TEXT_STYLES.valueMono);
    const amountBottom = drawDetailCell(
        doc,
        'Amount',
        [`${receipt.total.formatted} ${receipt.total.unit}`],
        DETAILS_COL2_X,
        y,
        TEXT_STYLES.valueMono,
    );
    y = Math.max(senderBottom, amountBottom) + DETAIL_ROW_GAP;

    // Row 3: Receiver | Amount USD (always shown; en-dash + no caption when missing)
    applyTextStyle(doc, TEXT_STYLES.valueMono);
    const receiverLines = doc.splitTextToSize(receipt.receiver.address, GRID.col.innerWidth) as string[];
    const receiverBottom = drawDetailCell(doc, 'Receiver', receiverLines, DETAILS_COL1_X, y, TEXT_STYLES.valueMono);

    const usdValueBottom = drawDetailCell(
        doc,
        'Amount USD - equivalent by Jupiter API',
        [usdValue ?? '–'],
        DETAILS_COL2_X,
        y,
        TEXT_STYLES.valueMono,
    );

    let usdBottom = usdValueBottom;
    if (usdValue) {
        const reportDateUtc = formatReportDateUtc(opts.reportDate ?? new Date());
        usdBottom = await drawJupiterEquivalentCaption(deps, doc, DETAILS_COL2_X, usdValueBottom - 1.5, reportDateUtc);
        usdBottom += USD_CAPTION_RESERVE - TEXT_STYLES.valueMono.size * LINE_HEIGHT_RATIO;
    }
    y = Math.max(receiverBottom, usdBottom) + DETAIL_ROW_GAP;

    // Row 4: Signature | Memo
    const sigBottom = drawSignatureCell(doc, signature, y, transactionUrl);
    const memoBottom = drawMemoCell(doc, receipt.memo, y);
    y = Math.max(sigBottom, memoBottom) + DETAIL_ROW_GAP;

    y = drawSupplierAndItems(doc, y);
    await drawPageFooter(deps, doc, receiptUrl, y);

    doc.save(`solana-receipt-${signature}.pdf`);
}
