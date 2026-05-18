import type { jsPDF } from 'jspdf';

import type { FormattedReceipt } from '../types';
import {
    applyLineStyle,
    applyTextStyle,
    BORDER_RADIUS,
    COLORS,
    GRID,
    LINE_STYLES,
    PAGE,
    TEXT_STYLES,
    type TextStyle,
} from './generate-receipt-pdf-styles';
import { parseUsdNumber, prorateUsd } from './parse-usd';
import {
    addSectionGap,
    drawJupiterAttribution,
    drawPageFooter,
    drawSectionTitle,
    drawSupplierAndItems,
    fitFontSize,
    initReceiptDoc,
    type PdfDeps,
    POST_TITLE_PADDING,
    svgToDataUrl,
} from './pdf-shared';
import { splitAtFirstNonZeroDigit } from './split-at-first-non-zero-digit';
import { WARNING_SVG } from './warning-svg';

const MAX_VISIBLE_TRANSFERS = 12;

const COL1_X = PAGE.marginX;
const COL2_X = PAGE.marginX + GRID.col.outerWidth;

// Vertical line-height ratio relative to the font size — empirical multiplier
// that gives a comfortable inline spacing for value lines within a cell.
const LINE_HEIGHT_RATIO = 0.45;

// Detail cell layout: gap from label baseline to first value baseline.
const DETAIL_LABEL_TO_VALUE_GAP = 4;
const DETAIL_ROW_GAP = 4; // gap below a detail row (signature, payment date / network fee)

// Transfers table widths.
const TABLE_AMOUNT_WIDTH = 42;
const TABLE_ADDRESS_WIDTH = (PAGE.contentWidth - TABLE_AMOUNT_WIDTH - GRID.col.gap * 2) / 2;
const TABLE_SENDER_X = PAGE.marginX;
const TABLE_RECEIVER_X = TABLE_SENDER_X + TABLE_ADDRESS_WIDTH + GRID.col.gap;
const TABLE_SENDER_WIDTH = TABLE_ADDRESS_WIDTH;
const TABLE_RECEIVER_WIDTH = TABLE_ADDRESS_WIDTH;
const TABLE_AMOUNT_RIGHT_X = PAGE.marginX + PAGE.contentWidth;
const AMOUNT_LINE_HEIGHT = TEXT_STYLES.value.size * LINE_HEIGHT_RATIO;

// Transfers table header: gap before the divider line and gap after it.
const TRANSFERS_HEADER_PRE_LINE_GAP = 2;
const TRANSFERS_HEADER_POST_LINE_GAP = 4;

// Transfer row: gap before the divider line and gap after it.
const TRANSFER_ROW_PRE_LINE_GAP = 1;
const TRANSFER_ROW_POST_LINE_GAP = 3;

// Truncation warning bar geometry.
const WARNING_BAR_HEIGHT = 8;
const WARNING_BAR_RADIUS = BORDER_RADIUS;
const WARNING_ICON_SIZE = 5;
const WARNING_INNER_PADDING = 2;
const WARNING_ICON_TO_TEXT_OFFSET = 1.05;
const WARNING_TEXT_RIGHT_PADDING = 4;
const WARNING_ICON_NATIVE_SIZE = 20; // px (the WARNING_SVG is 20x20)
const WARNING_AFTER_BAR_GAP = 6;

// Jupiter attribution line: gap below the caption.
const JUPITER_AFTER_GAP = 4;

// Signature link annotation: insets so the clickable rectangle hugs the
// signature text. The `+1`/`-1` tighten the box to the actual text bounds.
const SIG_LINK_TOP_INSET = 1;
const SIG_LINK_HEIGHT_PADDING = 1;

// Gap below the transfers table when no truncation warning was drawn.
const POST_TABLE_NO_WARNING_GAP = 2;

// Pulls the warning bar slightly tight against the table.
const WARNING_BAR_PRE_PULL = 1;

function drawDetailCell(
    doc: jsPDF,
    label: string,
    valueLines: string[],
    x: number,
    y: number,
    valueStyle: TextStyle,
): number {
    applyTextStyle(doc, TEXT_STYLES.label);
    doc.text(label, x, y);

    applyTextStyle(doc, valueStyle);
    const lineHeight = valueStyle.size * LINE_HEIGHT_RATIO;
    let cursor = y + DETAIL_LABEL_TO_VALUE_GAP;
    for (const line of valueLines) {
        doc.text(line, x, cursor);
        cursor += lineHeight;
    }
    return cursor;
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

function drawAddressCell(doc: jsPDF, address: string, x: number, y: number, maxWidth: number): void {
    applyTextStyle(doc, TEXT_STYLES.valueMono);
    const size = fitFontSize(doc, address, maxWidth, TEXT_STYLES.valueMono.size);
    doc.setFontSize(size);
    doc.text(address, x, y);
    doc.setFontSize(TEXT_STYLES.valueMono.size);
}

function drawAmountLine1(doc: jsPDF, formatted: string, unit: string, rightX: number, y: number): void {
    const { leadingZeros, significantDigits } = splitAtFirstNonZeroDigit(formatted);
    const suffix = ` ${unit}`;

    applyTextStyle(doc, TEXT_STYLES.valueStrong);
    const scaledSize = fitFontSize(doc, `${formatted}${suffix}`, TABLE_AMOUNT_WIDTH, TEXT_STYLES.value.size);

    let x = rightX;

    applyTextStyle(doc, TEXT_STYLES.amountDim);
    doc.setFontSize(scaledSize);
    x -= doc.getTextWidth(suffix);
    doc.text(suffix, x, y);

    applyTextStyle(doc, TEXT_STYLES.valueStrong);
    doc.setFontSize(scaledSize);
    x -= doc.getTextWidth(significantDigits);
    doc.text(significantDigits, x, y);

    if (leadingZeros) {
        applyTextStyle(doc, TEXT_STYLES.amountDim);
        doc.setFontSize(scaledSize);
        x -= doc.getTextWidth(leadingZeros);
        doc.text(leadingZeros, x, y);
    }
}

function drawAmountCell(
    doc: jsPDF,
    formatted: string,
    unit: string,
    proratedUsd: string | undefined,
    rightX: number,
    y: number,
): number {
    drawAmountLine1(doc, formatted, unit, rightX, y);

    if (!proratedUsd) {
        return y;
    }

    const line2Y = y + AMOUNT_LINE_HEIGHT;
    applyTextStyle(doc, TEXT_STYLES.valueUsd);
    const fittedUsdSize = fitFontSize(doc, proratedUsd, TABLE_AMOUNT_WIDTH, TEXT_STYLES.valueUsd.size);
    doc.setFontSize(fittedUsdSize);
    const wUsd = doc.getTextWidth(proratedUsd);
    doc.text(proratedUsd, rightX - wUsd, line2Y);

    return line2Y;
}

function drawTransferRow(
    doc: jsPDF,
    transfer: {
        amount: { formatted: string; unit: string };
        sender: { address: string };
        receiver: { address: string };
    },
    y: number,
    proratedUsd: string | undefined,
): number {
    drawAddressCell(doc, transfer.sender.address, TABLE_SENDER_X, y, TABLE_SENDER_WIDTH);
    drawAddressCell(doc, transfer.receiver.address, TABLE_RECEIVER_X, y, TABLE_RECEIVER_WIDTH);
    const amountBottom = drawAmountCell(
        doc,
        transfer.amount.formatted,
        transfer.amount.unit,
        proratedUsd,
        TABLE_AMOUNT_RIGHT_X,
        y,
    );

    const lineY = Math.max(y, amountBottom) + TRANSFER_ROW_PRE_LINE_GAP;
    applyLineStyle(doc, LINE_STYLES.border);
    doc.line(PAGE.marginX, lineY, PAGE.marginX + PAGE.contentWidth, lineY);

    return lineY + TRANSFER_ROW_POST_LINE_GAP;
}

async function drawWarningBar(deps: PdfDeps, doc: jsPDF, totalCount: number, y: number): Promise<number> {
    const text =
        `Only the ${MAX_VISIBLE_TRANSFERS} largest transfers are shown here. To view the full list of ` +
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
    const textMaxWidth = PAGE.marginX + PAGE.contentWidth - WARNING_INNER_PADDING - WARNING_TEXT_RIGHT_PADDING - textX;
    applyTextStyle(doc, TEXT_STYLES.warning);
    const fittedSize = fitFontSize(doc, text, textMaxWidth, TEXT_STYLES.warning.size);
    doc.setFontSize(fittedSize);
    doc.text(text, textX, y + WARNING_BAR_HEIGHT / 2, { baseline: 'middle' });
    doc.setFontSize(TEXT_STYLES.warning.size);

    return y + WARNING_BAR_HEIGHT + WARNING_AFTER_BAR_GAP;
}

export async function generateMultiTransferPdf(
    deps: PdfDeps,
    receipt: FormattedReceipt,
    signature: string,
    receiptUrl: string,
    transactionUrl?: string,
    usdValue?: string,
): Promise<void> {
    let { doc, y } = initReceiptDoc(deps);

    y = addSectionGap(y);
    y = drawSectionTitle(doc, 'Transaction details', y);
    y += POST_TITLE_PADDING;

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

    const signatureWidth = receipt.memo ? GRID.col.innerWidth : PAGE.contentWidth;
    applyTextStyle(doc, TEXT_STYLES.valueMono);
    const signatureLines = doc.splitTextToSize(signature, signatureWidth) as string[];
    const sigStartY = y;
    const sigBottom = drawDetailCell(doc, 'Signature', signatureLines, COL1_X, y, TEXT_STYLES.valueMono);
    if (transactionUrl) {
        const linkH = sigBottom - (sigStartY + DETAIL_LABEL_TO_VALUE_GAP) + SIG_LINK_HEIGHT_PADDING;
        doc.link(COL1_X, sigStartY + SIG_LINK_TOP_INSET, signatureWidth, linkH, { url: transactionUrl });
    }

    let memoBottom = y;
    if (receipt.memo) {
        applyTextStyle(doc, TEXT_STYLES.value);
        const memoLines = doc.splitTextToSize(receipt.memo, GRID.col.innerWidth) as string[];
        memoBottom = drawDetailCell(doc, 'Memo', memoLines, COL2_X, y, TEXT_STYLES.value);
    }

    y = Math.max(sigBottom, memoBottom) + DETAIL_ROW_GAP;

    y = addSectionGap(y);
    y = drawSectionTitle(doc, 'Transfers', y);
    y += POST_TITLE_PADDING;

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
    const visibleTransfers = transfers.slice(0, MAX_VISIBLE_TRANSFERS);
    const hiddenCount = transfers.length - visibleTransfers.length;

    const totalUsdNum = usdValue ? parseUsdNumber(usdValue) : null;

    y = drawTransfersHeader(doc, y);

    for (const t of visibleTransfers) {
        const proratedUsd =
            totalUsdNum !== null && receipt.total.raw > 0
                ? prorateUsd(t.amount.raw, receipt.total.raw, totalUsdNum)
                : undefined;
        y = drawTransferRow(doc, t, y, proratedUsd);
    }

    if (hiddenCount > 0) {
        y = await drawWarningBar(deps, doc, transfers.length, y - WARNING_BAR_PRE_PULL);
    } else {
        y += POST_TABLE_NO_WARNING_GAP;
    }

    if (usdValue && totalUsdNum !== null && receipt.total.raw > 0) {
        y = drawJupiterAttribution(doc, PAGE.marginX, y, JUPITER_AFTER_GAP);
    }

    y = drawSupplierAndItems(doc, receipt, y);
    await drawPageFooter(deps, doc, receiptUrl, y);

    doc.save(`solana-receipt-${signature}.pdf`);
}
