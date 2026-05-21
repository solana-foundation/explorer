import type { jsPDF } from 'jspdf';

import type { FormattedReceipt } from '../types';
import {
    applyLineStyle,
    applyTextStyle,
    BORDER_RADIUS,
    COLORS,
    LINE_STYLES,
    PAGE,
    TEXT_STYLES,
} from './generate-receipt-pdf-styles';
import {
    addSectionGap,
    DETAIL_ROW_GAP,
    DETAILS_COL1_X,
    DETAILS_COL2_X,
    drawDetailCell,
    drawMemoCell,
    drawPageFooter,
    drawSectionTitle,
    drawSignatureCell,
    drawSupplierAndItems,
    fitFontSize,
    initReceiptDoc,
    type PdfDeps,
    type ReceiptPdfOpts,
    svgToDataUrl,
} from './pdf-shared';
import { splitAtFirstNonZeroDigit } from './split-at-first-non-zero-digit';
import { WARNING_SVG } from './warning-svg';

// Max displayed rows in the transfers table.
const MAX_VISIBLE_TRANSFERS = 18;
// Max displayed rows in the transfers table with warning.
// For more than 18 transfers, we show 16 rows + warning, which fits the same vertical space as 18 rows without warning.
const MAX_VISIBLE_TRANSFERS_WITH_WARNING = 16;

// Transfers table widths — design: 393px / 393px / 220px across a 1030px row,
// mapped onto the 170mm A4 content band (≈ 6.06 px/mm).
const TABLE_ADDRESS_WIDTH = 64.9;
const TABLE_AMOUNT_WIDTH = 36.3;
const TABLE_COL_GAP = (PAGE.contentWidth - TABLE_ADDRESS_WIDTH * 2 - TABLE_AMOUNT_WIDTH) / 2;
const TABLE_SENDER_X = PAGE.marginX;
const TABLE_RECEIVER_X = TABLE_SENDER_X + TABLE_ADDRESS_WIDTH + TABLE_COL_GAP;
const TABLE_AMOUNT_RIGHT_X = PAGE.marginX + PAGE.contentWidth;

// Transfers table header: gap before the divider line and gap after it.
const TRANSFERS_HEADER_PRE_LINE_GAP = 2;
const TRANSFERS_HEADER_POST_LINE_GAP = 2.8;

// Transfer row: gap before the divider line and gap after it.
const TRANSFER_ROW_PRE_LINE_GAP = 1.75;
const TRANSFER_ROW_POST_LINE_GAP = 2.75;
const TRANSFER_ROW_HEIGHT = TRANSFER_ROW_PRE_LINE_GAP + TRANSFER_ROW_POST_LINE_GAP;

// Truncation warning bar geometry. The bar's vertical footprint is sized to
// ~ 1.5-2 transfer-row heights so that "16 rows + warning" matches the
// height of "18 rows" — the supplier section below starts at the same y in
// both cases.
const WARNING_BAR_HEIGHT = TRANSFER_ROW_HEIGHT * 1.5;
const WARNING_BAR_RADIUS = BORDER_RADIUS;
const WARNING_ICON_SIZE = 4;
const WARNING_INNER_PADDING = 1.5;
const WARNING_ICON_TO_TEXT_OFFSET = 1.05;
const WARNING_ICON_NATIVE_SIZE = 20; // px (the WARNING_SVG is 20x20)

// Trailing gap appended after the transfers table (with or without warning).
const POST_TABLE_GAP = 2;

export async function generateMultiTransferPdf(
    deps: PdfDeps,
    receipt: FormattedReceipt,
    opts: ReceiptPdfOpts,
): Promise<void> {
    const { signature, receiptUrl, transactionUrl } = opts;
    const { doc, y: initialY } = initReceiptDoc(deps, opts.clusterLabel);
    let y = initialY;

    y = addSectionGap(y);
    // - Title
    y = drawSectionTitle(doc, 'Transaction details', y);

    // - Details secttion with two columns grid
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

    // Row 2: Signature | Memo
    const sigBottom = drawSignatureCell(doc, signature, y, transactionUrl);
    drawMemoCell(doc, receipt.memo, y);

    // Anchor the next section on the signature column only — signature line
    // count is deterministic, so the Transfers title sits at a fixed y
    // regardless of how tall the memo wraps.
    y = sigBottom + DETAIL_ROW_GAP;

    y = addSectionGap(y);

    // - Transfers section with table
    y = drawSectionTitle(doc, 'Transfers', y);

    const transfers =
        receipt.transfers && receipt.transfers.length > 1
            ? [...receipt.transfers].sort((a, b) => b.amount.raw - a.amount.raw)
            : [
                  {
                      amount: { formatted: receipt.total.formatted, raw: receipt.total.raw, unit: receipt.total.unit },
                      receiver: receipt.receiver,
                      sender: receipt.sender,
                  },
              ];
    const isOverflow = transfers.length > MAX_VISIBLE_TRANSFERS;
    const visibleCount = isOverflow ? MAX_VISIBLE_TRANSFERS_WITH_WARNING : MAX_VISIBLE_TRANSFERS;
    const visibleTransfers = transfers.slice(0, visibleCount);

    y = drawTransfersHeader(doc, y);

    for (const t of visibleTransfers) {
        y = drawTransferRow(doc, t, y);
    }

    if (isOverflow) {
        y = await drawWarningBar(deps, doc, transfers.length, y - 1);
    }
    y += POST_TABLE_GAP;

    // - Supplier section and footer
    y = drawSupplierAndItems(doc, y, false);
    await drawPageFooter(deps, doc, receiptUrl, y);

    doc.save(`solana-receipt-${signature}.pdf`);
}

function drawTransfersHeader(doc: jsPDF, y: number): number {
    applyTextStyle(doc, TEXT_STYLES.label);
    doc.text('Sender', TABLE_SENDER_X, y);
    doc.text('Receiver', TABLE_RECEIVER_X, y);
    doc.text('Amount', TABLE_AMOUNT_RIGHT_X, y, { align: 'right' });
    y += TRANSFERS_HEADER_PRE_LINE_GAP;
    applyLineStyle(doc, LINE_STYLES.border);
    doc.line(PAGE.marginX, y, PAGE.marginX + PAGE.contentWidth, y);
    return y + TRANSFERS_HEADER_POST_LINE_GAP;
}

function drawAddressCell(doc: jsPDF, address: string, x: number, y: number): void {
    applyTextStyle(doc, TEXT_STYLES.tableAddress);
    doc.text(address, x, y);
}

function drawAmountCell(doc: jsPDF, formatted: string, unit: string, rightX: number, y: number): void {
    const { leadingZeros, significantDigits } = splitAtFirstNonZeroDigit(formatted);
    const suffix = ` ${unit}`;

    let x = rightX;

    applyTextStyle(doc, TEXT_STYLES.tableAmountDim);
    x -= doc.getTextWidth(suffix);
    doc.text(suffix, x, y);

    applyTextStyle(doc, TEXT_STYLES.tableAmountStrong);
    x -= doc.getTextWidth(significantDigits);
    doc.text(significantDigits, x, y);

    if (leadingZeros) {
        applyTextStyle(doc, TEXT_STYLES.tableAmountDim);
        x -= doc.getTextWidth(leadingZeros);
        doc.text(leadingZeros, x, y);
    }
}

function drawTransferRow(
    doc: jsPDF,
    transfer: {
        amount: { formatted: string; unit: string };
        sender: { address: string };
        receiver: { address: string };
    },
    y: number,
): number {
    drawAddressCell(doc, transfer.sender.address, TABLE_SENDER_X, y);
    drawAddressCell(doc, transfer.receiver.address, TABLE_RECEIVER_X, y);
    drawAmountCell(doc, transfer.amount.formatted, transfer.amount.unit, TABLE_AMOUNT_RIGHT_X, y);

    const lineY = y + TRANSFER_ROW_PRE_LINE_GAP;
    applyLineStyle(doc, LINE_STYLES.border);
    doc.line(PAGE.marginX, lineY, PAGE.marginX + PAGE.contentWidth, lineY);

    return lineY + TRANSFER_ROW_POST_LINE_GAP;
}

async function drawWarningBar(deps: PdfDeps, doc: jsPDF, totalCount: number, y: number): Promise<number> {
    const text =
        `Only the ${MAX_VISIBLE_TRANSFERS_WITH_WARNING} largest transfers are shown here. To view the full list of ` +
        `${totalCount} transfers, export the CSV. You can also use the QR code at the end of the receipt to access the full details.`;

    doc.setFillColor(COLORS.warningBg);
    doc.roundedRect(
        PAGE.marginX,
        y,
        PAGE.contentWidth,
        WARNING_BAR_HEIGHT,
        WARNING_BAR_RADIUS,
        WARNING_BAR_RADIUS,
        'F',
    );

    try {
        const iconUrl = await svgToDataUrl(WARNING_SVG, WARNING_ICON_NATIVE_SIZE, WARNING_ICON_NATIVE_SIZE);
        doc.addImage(
            iconUrl,
            'PNG',
            PAGE.marginX + WARNING_INNER_PADDING,
            y + (WARNING_BAR_HEIGHT - WARNING_ICON_SIZE) / 2,
            WARNING_ICON_SIZE,
            WARNING_ICON_SIZE,
        );
    } catch (error) {
        deps.onError(error);
    }

    const textX = PAGE.marginX + WARNING_INNER_PADDING + WARNING_ICON_SIZE + WARNING_ICON_TO_TEXT_OFFSET;
    const textMaxWidth = PAGE.marginX + PAGE.contentWidth - WARNING_INNER_PADDING - WARNING_ICON_TO_TEXT_OFFSET - textX;
    applyTextStyle(doc, TEXT_STYLES.warning);
    const fittedSize = fitFontSize(doc, text, textMaxWidth, TEXT_STYLES.warning.size);
    doc.setFontSize(fittedSize);
    doc.text(text, textX, y + WARNING_BAR_HEIGHT / 2, { baseline: 'middle' });
    doc.setFontSize(TEXT_STYLES.warning.size);

    return y + WARNING_BAR_HEIGHT;
}
