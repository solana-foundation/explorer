import type { AcroFormTextField, jsPDF } from 'jspdf';
import type { toDataURL as ToDataURL } from 'qrcode';

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
import { LOGO_SVG } from './logo-svg';
import { parseUsdNumber, prorateUsd } from './parse-usd';
import { splitAtFirstNonZeroDigit } from './split-at-first-non-zero-digit';
import { WARNING_SVG } from './warning-svg';

export type PdfDeps = {
    JsPDF: typeof import('jspdf').jsPDF;
    onError?: (error: unknown) => void;
    qrToDataURL: typeof ToDataURL;
};

const MAX_VISIBLE_TRANSFERS = 12;

async function svgToDataUrl(svg: string, width: number, height: number): Promise<string> {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    try {
        const img = new Image();
        img.src = url;
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
        });

        const canvas = document.createElement('canvas');
        canvas.width = width * 2;
        canvas.height = height * 2;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context unavailable');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        return canvas.toDataURL('image/png');
    } finally {
        URL.revokeObjectURL(url);
    }
}

const SECTION_GAP = 6;
const SECTION_TITLE_HEIGHT = 6;
const POST_TITLE_PADDING = 2;
const POST_SECTION_PADDING = 2;
const LABEL_TO_FIELD_GAP = 1;
const POST_FIELD_GAP = 4;
const DEFAULT_FIELD_HEIGHT = 6;
const POST_TOTAL_ROW_PADDING = 6;
const PAGE_TOP_Y = 20;
const PAGE_BOTTOM_PADDING = 20;

function addSectionGap(y: number): number {
    return y + SECTION_GAP;
}

function labeledFieldHeight(fieldHeight: number): number {
    return LABEL_TO_FIELD_GAP + POST_FIELD_GAP + fieldHeight;
}

function ensurePageSpace(doc: jsPDF, y: number, needed: number): number {
    if (y + needed > PAGE.height - PAGE_BOTTOM_PADDING) {
        doc.addPage();
        return PAGE_TOP_Y;
    }
    return y;
}

function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
    applyTextStyle(doc, TEXT_STYLES.sectionTitle);
    doc.text(title, PAGE.marginX, y);
    return y + SECTION_TITLE_HEIGHT;
}

function addEditableField(
    doc: jsPDF,
    fieldName: string,
    x: number,
    y: number,
    width: number,
    height: number,
    defaultValue = '',
    multiline = false,
    textAlign = 0,
    bold = false,
    fontSize = 8,
): void {
    doc.setFillColor(COLORS.fieldBg);
    applyLineStyle(doc, LINE_STYLES.border);
    doc.roundedRect(x, y, width, height, BORDER_RADIUS, BORDER_RADIUS, 'FD');

    const TextField = doc.AcroForm.TextField as unknown as new () => AcroFormTextField;
    const field = new TextField();
    field.fieldName = fieldName;
    field.multiline = multiline;
    // Inset the widget annotation inside the rounded rect so the viewer's
    // rectangular field highlight doesn't overflow the rounded corners
    const inset = BORDER_RADIUS / 3;
    field.x = x + inset;
    field.y = y + inset;
    field.width = width - inset * 2;
    field.height = height - inset * 2;
    field.fontSize = fontSize;
    field.defaultValue = defaultValue;
    field.value = defaultValue;
    (field as unknown as Record<string, unknown>).textAlign = textAlign;
    if (bold) {
        (field as unknown as Record<string, unknown>).fontStyle = 'bold';
    }
    doc.addField(field);
}

function drawLabeledField(
    doc: jsPDF,
    label: string,
    fieldName: string,
    y: number,
    defaultValue = '',
    multiline = false,
    height = DEFAULT_FIELD_HEIGHT,
): number {
    applyTextStyle(doc, TEXT_STYLES.label);
    doc.text(label, PAGE.marginX, y);

    y += LABEL_TO_FIELD_GAP;

    addEditableField(doc, fieldName, PAGE.marginX, y, PAGE.contentWidth, height, defaultValue, multiline);
    return y + POST_FIELD_GAP + height;
}

const FOOTER_LABEL_X = PAGE.marginX + 90;
const FOOTER_FIELD_X = FOOTER_LABEL_X + 30;
const FOOTER_FIELD_WIDTH = PAGE.marginX + PAGE.contentWidth - FOOTER_FIELD_X;
const FOOTER_FONT_SIZE = 10;
const FOOTER_CELL_HEIGHT = 6;

function drawTotalRow(doc: jsPDF, label: string, fieldName: string, value: string, y: number): number {
    applyTextStyle(doc, TEXT_STYLES.valueStrong);
    doc.text(label, FOOTER_LABEL_X, y + FOOTER_CELL_HEIGHT / 2, { baseline: 'middle' });
    addEditableField(
        doc,
        fieldName,
        FOOTER_FIELD_X,
        y,
        FOOTER_FIELD_WIDTH,
        FOOTER_CELL_HEIGHT,
        value,
        false,
        0,
        true,
        FOOTER_FONT_SIZE,
    );
    return y + FOOTER_CELL_HEIGHT + POST_TOTAL_ROW_PADDING;
}

// ----- Transaction details (2-column grid) -----
const COL1_X = PAGE.marginX;
const COL2_X = PAGE.marginX + GRID.col.outerWidth;

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
    const lineHeight = valueStyle.size * 0.45;
    let cursor = y + 4;
    for (const line of valueLines) {
        doc.text(line, x, cursor);
        cursor += lineHeight;
    }
    return cursor;
}

// ----- Transfers table -----
const TABLE_AMOUNT_WIDTH = 42;
const TABLE_ADDRESS_WIDTH = (PAGE.contentWidth - TABLE_AMOUNT_WIDTH - GRID.col.gap * 2) / 2;
const TABLE_SENDER_X = PAGE.marginX;
const TABLE_RECEIVER_X = TABLE_SENDER_X + TABLE_ADDRESS_WIDTH + GRID.col.gap;
const TABLE_SENDER_WIDTH = TABLE_ADDRESS_WIDTH;
const TABLE_RECEIVER_W = TABLE_ADDRESS_WIDTH;
const TABLE_AMOUNT_RIGHT_X = PAGE.marginX + PAGE.contentWidth;
const AMOUNT_LINE_HEIGHT = TEXT_STYLES.value.size * 0.45;

function drawTransfersHeader(doc: jsPDF, y: number): number {
    applyTextStyle(doc, TEXT_STYLES.label);
    doc.text('Sender', TABLE_SENDER_X, y);
    doc.text('Receiver', TABLE_RECEIVER_X, y);
    doc.text('Amount', TABLE_AMOUNT_RIGHT_X, y, { align: 'right' });
    y += 2;
    applyLineStyle(doc, LINE_STYLES.border);
    doc.line(PAGE.marginX, y, PAGE.marginX + PAGE.contentWidth, y);
    return y + 4;
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
    drawAddressCell(doc, transfer.receiver.address, TABLE_RECEIVER_X, y, TABLE_RECEIVER_W);
    const amountBottom = drawAmountCell(
        doc,
        transfer.amount.formatted,
        transfer.amount.unit,
        proratedUsd,
        TABLE_AMOUNT_RIGHT_X,
        y,
    );

    const lineY = Math.max(y, amountBottom) + 2;
    applyLineStyle(doc, LINE_STYLES.border);
    doc.line(PAGE.marginX, lineY, PAGE.marginX + PAGE.contentWidth, lineY);

    return lineY + 4;
}

function drawAddressCell(doc: jsPDF, address: string, x: number, y: number, maxWidth: number): void {
    applyTextStyle(doc, TEXT_STYLES.valueMono);
    const size = fitFontSize(doc, address, maxWidth, TEXT_STYLES.valueMono.size);
    doc.setFontSize(size);
    doc.text(address, x, y);
    doc.setFontSize(TEXT_STYLES.valueMono.size);
}

/**
 * Returns a font size (pt) at which `text` renders within `maxWidth` on a single line.
 *
 * Measures the text at `baseSize` using the doc's currently-active font family
 * Then scales the size down proportionally if the text would overflow.
 * If `text` already fits at `baseSize`, returns `baseSize` unchanged — no upscaling.
 *
 * Use this to shrink-to-fit content into a fixed cell/bar width.
 */
function fitFontSize(doc: jsPDF, text: string, maxWidth: number, baseSize: number): number {
    doc.setFontSize(baseSize);
    const w = doc.getTextWidth(text);
    return w > maxWidth ? baseSize * (maxWidth / w) : baseSize;
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

const WARNING_BAR_HEIGHT = 8;
const WARNING_BAR_RADIUS = BORDER_RADIUS;
const WARNING_ICON_SIZE = 5;
const WARNING_INNER_PADDING = 2;
const WARNING_ICON_TO_TEXT_OFFSET = 1.05;
const WARNING_TEXT_RIGHT_PADDING = 4;

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
        const iconUrl = await svgToDataUrl(WARNING_SVG, 20, 20);
        doc.addImage(
            iconUrl,
            'PNG',
            PAGE.marginX + WARNING_INNER_PADDING,
            y + (WARNING_BAR_HEIGHT - WARNING_ICON_SIZE) / 2,
            WARNING_ICON_SIZE,
            WARNING_ICON_SIZE,
        );
    } catch (error) {
        deps.onError?.(error);
    }

    const textX = PAGE.marginX + WARNING_INNER_PADDING + WARNING_ICON_SIZE + WARNING_ICON_TO_TEXT_OFFSET;
    const textMaxWidth = PAGE.marginX + PAGE.contentWidth - WARNING_INNER_PADDING - WARNING_TEXT_RIGHT_PADDING - textX;
    applyTextStyle(doc, TEXT_STYLES.warning);
    const fittedSize = fitFontSize(doc, text, textMaxWidth, TEXT_STYLES.warning.size);
    doc.setFontSize(fittedSize);
    doc.text(text, textX, y + WARNING_BAR_HEIGHT / 2, { baseline: 'middle' });
    doc.setFontSize(TEXT_STYLES.warning.size);

    return y + WARNING_BAR_HEIGHT + 6;
}

export async function loadPdfDeps(): Promise<PdfDeps> {
    const [{ jsPDF: JsPDF }, { toDataURL: qrToDataURL }] = await Promise.all([import('jspdf'), import('qrcode')]);
    return { JsPDF, qrToDataURL };
}

export async function generateReceiptPdf(
    deps: PdfDeps,
    receipt: FormattedReceipt,
    signature: string,
    receiptUrl: string,
    transactionUrl?: string,
    usdValue?: string,
): Promise<void> {
    const doc = new deps.JsPDF({ format: 'a4', unit: 'mm' });

    let y = 20;

    // ----- TITLE -----
    applyTextStyle(doc, TEXT_STYLES.title);
    doc.text('Solana Payment Receipt', PAGE.marginX, y);
    y += 4;

    applyTextStyle(doc, TEXT_STYLES.subtitle);
    doc.text('On-chain Transaction Record', PAGE.marginX, y);
    y += 4;

    // ----- TRANSACTION DETAILS -----
    y = addSectionGap(y);
    y = drawSectionTitle(doc, 'Transaction details', y);
    y += 2;

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
    y = Math.max(dateBottom, feeBottom) + 4;

    // Row 2: Signature | Memo (signature spans full width when memo is absent)
    const signatureWidth = receipt.memo ? GRID.col.innerWidth : PAGE.contentWidth;
    applyTextStyle(doc, TEXT_STYLES.valueMono);
    const signatureLines = doc.splitTextToSize(signature, signatureWidth) as string[];
    const sigStartY = y;
    const sigBottom = drawDetailCell(doc, 'Signature', signatureLines, COL1_X, y, TEXT_STYLES.valueMono);
    if (transactionUrl) {
        const linkH = sigBottom - (sigStartY + 4) + 1;
        doc.link(COL1_X, sigStartY + 1, signatureWidth, linkH, { url: transactionUrl });
    }

    let memoBottom = y;
    if (receipt.memo) {
        applyTextStyle(doc, TEXT_STYLES.value);
        const memoLines = doc.splitTextToSize(receipt.memo, GRID.col.innerWidth) as string[];
        memoBottom = drawDetailCell(doc, 'Memo', memoLines, COL2_X, y, TEXT_STYLES.value);
    }

    y = Math.max(sigBottom, memoBottom) + 4;

    // ----- TRANSFERS -----
    y = addSectionGap(y);
    y = drawSectionTitle(doc, 'Transfers', y);
    y += 2;

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
        y = await drawWarningBar(deps, doc, transfers.length, y - 1);
    } else {
        y += 2;
    }

    // ----- SUPPLIER / SELLER -----
    const ADDRESS_HEIGHT = 12;
    const DESCRIPTION_HEIGHT = 54;
    const SUPPLIER_SECTION_HEIGHT =
        SECTION_GAP +
        SECTION_TITLE_HEIGHT +
        POST_TITLE_PADDING +
        labeledFieldHeight(DEFAULT_FIELD_HEIGHT) +
        labeledFieldHeight(ADDRESS_HEIGHT) +
        POST_SECTION_PADDING;
    const ITEMS_SECTION_HEIGHT =
        SECTION_GAP +
        SECTION_TITLE_HEIGHT +
        DESCRIPTION_HEIGHT +
        POST_TITLE_PADDING +
        FOOTER_CELL_HEIGHT +
        POST_TOTAL_ROW_PADDING;
    // Keep Supplier and Items together: if they won't both fit, break before Supplier
    y = ensurePageSpace(doc, y, SUPPLIER_SECTION_HEIGHT + ITEMS_SECTION_HEIGHT);
    y = addSectionGap(y);
    y = drawSectionTitle(doc, 'Supplier / Seller Information', y);
    y += POST_TITLE_PADDING;

    y = drawLabeledField(doc, 'Full Name', 'supplier_name', y);
    y = drawLabeledField(doc, 'Address', 'supplier_address', y, '', true, ADDRESS_HEIGHT);
    y += POST_SECTION_PADDING;
    // ----- END SUPPLIER / SELLER -----

    // ----- ITEMS / SERVICES -----
    y = addSectionGap(y);
    y = drawSectionTitle(doc, 'Items / Services', y);

    addEditableField(doc, 'items_description', PAGE.marginX, y, PAGE.contentWidth, DESCRIPTION_HEIGHT, '', true);
    y += DESCRIPTION_HEIGHT + POST_TITLE_PADDING;

    y = drawTotalRow(doc, 'TOTAL', 'total', `${receipt.total.formatted} ${receipt.total.unit}`, y);
    // ----- END ITEMS / SERVICES -----

    // ----- FOOTER -----
    const FOOTER_HEIGHT = 55; // divider + disclaimer + logo/QR + caption
    y = ensurePageSpace(doc, y, FOOTER_HEIGHT);
    y = addSectionGap(y);

    applyTextStyle(doc, TEXT_STYLES.disclaimer);
    const disclaimer =
        'This receipt was automatically generated by Solana Explorer based on publicly available on-chain transaction data. ' +
        'On-chain data (addresses, amounts, dates, signatures) is pre-filled from the blockchain. ' +
        'Editable fields (supplier info, items) are provided for the user to complete manually. ' +
        'This receipt is not a tax invoice unless completed with appropriate details.';
    const disclaimerLines = doc.splitTextToSize(disclaimer, PAGE.contentWidth);
    doc.text(disclaimerLines, PAGE.marginX, y);
    y += disclaimerLines.length * 3.5 + 4;

    // Footer: logo (left) + QR code (right)
    const qrSize = 25;
    const qrX = PAGE.marginX + PAGE.contentWidth - qrSize;

    try {
        const logoDataUrl = await svgToDataUrl(LOGO_SVG, 229, 28);
        const logoWidth = 50;
        const logoHeight = (28 / 229) * logoWidth;
        doc.addImage(logoDataUrl, 'PNG', PAGE.marginX, y, logoWidth, logoHeight);
    } catch (error) {
        deps.onError?.(error);
        // Fallback: render text if canvas is unavailable (e.g. in tests)
        applyTextStyle(doc, TEXT_STYLES.logoFallback);
        doc.text('Solana Explorer', PAGE.marginX, y + 4);
    }

    try {
        const qrDataUrl = await deps.qrToDataURL(receiptUrl, { margin: 0, width: 200 });
        doc.addImage(qrDataUrl, 'PNG', qrX, y, qrSize, qrSize);
        applyTextStyle(doc, TEXT_STYLES.caption);
        doc.text('Verify on Solana Explorer', qrX + qrSize / 2, y + qrSize + 3, { align: 'center' });
    } catch (error) {
        deps.onError?.(error);
    }

    doc.save(`solana-receipt-${signature}.pdf`);
}
