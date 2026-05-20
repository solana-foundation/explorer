import type { FormattedReceipt } from '../types';
import type { ReceiptPdfOpts } from './generate-receipt-pdf';
import { applyTextStyle, GRID, PAGE, TEXT_STYLES } from './generate-receipt-pdf-styles';
import {
    addSectionGap,
    DETAIL_LABEL_TO_VALUE_GAP,
    DETAIL_ROW_GAP,
    drawDetailCell,
    drawJupiterEquivalentCaption,
    drawPageFooter,
    drawSectionTitle,
    drawSupplierAndItems,
    initReceiptDoc,
    LINE_HEIGHT_RATIO,
    type PdfDeps,
    truncateMemo,
} from './pdf-shared';

const COL1_X = PAGE.marginX;
const COL2_X = PAGE.marginX + GRID.col.outerWidth;

// Signature link annotation insets — match multi-transfer layout so a clicked
// signature opens the on-chain transaction in any PDF viewer.
const SIG_LINK_TOP_INSET = 1;
const SIG_LINK_HEIGHT_PADDING = 1;

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
    const dateBottom = drawDetailCell(doc, 'Payment date', [receipt.date.utc], COL1_X, y, TEXT_STYLES.valueMono);
    const feeBottom = drawDetailCell(
        doc,
        'Network fee',
        [`${receipt.fee.formatted} SOL`],
        COL2_X,
        y,
        TEXT_STYLES.valueMono,
    );
    y = Math.max(dateBottom, feeBottom) + DETAIL_ROW_GAP;

    // Row 2: Sender | Amount
    applyTextStyle(doc, TEXT_STYLES.valueMono);
    const senderLines = doc.splitTextToSize(receipt.sender.address, GRID.col.innerWidth) as string[];
    const senderBottom = drawDetailCell(doc, 'Sender', senderLines, COL1_X, y, TEXT_STYLES.valueMono);
    const amountBottom = drawDetailCell(
        doc,
        'Amount',
        [`${receipt.total.formatted} ${receipt.total.unit}`],
        COL2_X,
        y,
        TEXT_STYLES.valueMono,
    );
    y = Math.max(senderBottom, amountBottom) + DETAIL_ROW_GAP;

    // Row 3: Receiver | Amount USD (always shown; dash + no caption when missing)
    applyTextStyle(doc, TEXT_STYLES.valueMono);
    const receiverLines = doc.splitTextToSize(receipt.receiver.address, GRID.col.innerWidth) as string[];
    const receiverBottom = drawDetailCell(doc, 'Receiver', receiverLines, COL1_X, y, TEXT_STYLES.valueMono);

    const usdValueBottom = drawDetailCell(
        doc,
        'Amount USD - equivalent by Jupiter API',
        [usdValue ?? '-'],
        COL2_X,
        y,
        TEXT_STYLES.valueMono,
    );

    let usdBottom = usdValueBottom;
    if (usdValue) {
        const reportDateUtc = formatReportDateUtc(opts.reportDate ?? new Date());
        usdBottom = await drawJupiterEquivalentCaption(deps, doc, COL2_X, usdValueBottom - 1.5, reportDateUtc);
        usdBottom += USD_CAPTION_RESERVE - TEXT_STYLES.valueMono.size * LINE_HEIGHT_RATIO;
    }
    y = Math.max(receiverBottom, usdBottom) + DETAIL_ROW_GAP;

    // Row 4: Signature | Memo
    applyTextStyle(doc, TEXT_STYLES.valueMono);
    const signatureLines = doc.splitTextToSize(signature, GRID.col.innerWidth) as string[];
    const sigStartY = y;
    const sigBottom = drawDetailCell(doc, 'Signature', signatureLines, COL1_X, y, TEXT_STYLES.valueMono);
    if (transactionUrl) {
        const linkH = sigBottom - (sigStartY + DETAIL_LABEL_TO_VALUE_GAP) + SIG_LINK_HEIGHT_PADDING;
        doc.link(COL1_X, sigStartY + SIG_LINK_TOP_INSET, GRID.col.innerWidth, linkH, { url: transactionUrl });
    }

    applyTextStyle(doc, TEXT_STYLES.valueMono);
    const memoLines = doc.splitTextToSize(truncateMemo(receipt.memo), GRID.col.innerWidth) as string[];
    const memoBottom = drawDetailCell(doc, 'Memo', memoLines, COL2_X, y, TEXT_STYLES.valueMono);

    y = Math.max(sigBottom, memoBottom) + DETAIL_ROW_GAP;

    y = drawSupplierAndItems(doc, y);
    await drawPageFooter(deps, doc, receiptUrl, y);

    doc.save(`solana-receipt-${signature}.pdf`);
}
