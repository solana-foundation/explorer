import type { AcroFormTextField, jsPDF } from 'jspdf';
import type { toDataURL as ToDataURL } from 'qrcode';

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
import { INFO_CIRCLE_SVG } from './info-circle-svg';
import { LOGO_SVG } from './logo-svg';
import { loadPdfFonts, type PdfFonts, registerPdfFonts } from './pdf-fonts';

export type PdfDeps = {
    JsPDF: typeof jsPDF;
    fonts: PdfFonts;
    onError: (error: unknown) => void;
    qrToDataURL: typeof ToDataURL;
};

export type ReceiptPdfOpts = {
    signature: string;
    receiptUrl: string;
    clusterLabel: string;
    transactionUrl?: string;
    reportDate?: Date;
    usdValue?: string;
};

export type TitleBlockSizes = {
    afterSubtitleGap: number; // mm below subtitle baseline
    afterTitleGap: number; // mm between title baseline and subtitle baseline
};

export type PageFooterSizes = {
    logoSvgHeight: number; // native SVG height (used to preserve aspect ratio)
    logoSvgWidth: number; // native SVG width
    logoWidth: number; // rendered width in mm
    qrPixelWidth: number; // qrcode lib rasterization size (px)
    qrSize: number; // rendered QR size in mm (square)
};

export const JUPITER_ATTRIBUTION = 'Estimated current value at time of download provided by Jupiter API';

export const MEMO_MAX_CHARS = 130;

export function truncateMemo(memo: string | undefined | null): string {
    if (!memo) return '-';
    return memo.length > MEMO_MAX_CHARS ? `${memo.slice(0, MEMO_MAX_CHARS)}...` : memo;
}

// Top margin: y at which content starts on every page.
export const PAGE_TOP_Y = 15;
// Reserved blank strip at the bottom of the page; ensurePageSpace triggers a new page once a draw would cross it.
export const PAGE_BOTTOM_PADDING = 14;
// Vertical space inserted before a new section title.
export const SECTION_GAP = 4;
// Vertical advance after drawing a section title (heading row height).
export const SECTION_TITLE_HEIGHT = 6;
// Small trailing padding added after a section's last field, before the next SECTION_GAP.
export const POST_SECTION_PADDING = 1;
// Gap between a field's label baseline and the top of the field rectangle below it.
export const LABEL_TO_FIELD_GAP = 1.5;
// Gap appended after a field rectangle before the next labeled element.
export const POST_FIELD_GAP = 3;
// Default height of an editable single-line AcroForm field.
export const DEFAULT_FIELD_HEIGHT = 6;
// Trailing padding under the Total row in the supplier/items section.
export const POST_TOTAL_ROW_PADDING = 4;
// Height of the Total row cell (and matching label baseline-center anchor).
export const FOOTER_CELL_HEIGHT = 6;

// Two-column detail grid (used by both single and multi layouts).
export const DETAIL_LABEL_TO_VALUE_GAP = 4;
export const DETAIL_ROW_GAP = 4;
// Empirical inline line-height multiplier (font size × ratio = line height in mm).
export const LINE_HEIGHT_RATIO = 0.45;
// Coordinates for the two-column details section at the top of the receipt.
export const DETAILS_COL1_X = PAGE.marginX;
export const DETAILS_COL2_X = PAGE.marginX + GRID.col.outerWidth;
// Signature link annotation: insets so the clickable rectangle hugs the
// signature text rather than the surrounding label/gap.
export const SIG_LINK_TOP_INSET = 1;
export const SIG_LINK_HEIGHT_PADDING = 1;

// Jupiter "report date" caption: icon size + inline gap from icon to text.
const JUPITER_ICON_SIZE = 2.2;
const JUPITER_ICON_TO_TEXT_GAP = 1;
const JUPITER_ICON_NATIVE_SIZE = 12; // INFO_CIRCLE_SVG is 12x12

const FOOTER_FIELD_WIDTH = 67.5;
const FOOTER_FIELD_X = PAGE.marginX + PAGE.contentWidth - FOOTER_FIELD_WIDTH;
const TOTAL_LABEL_TO_FIELD_GAP = 1.5;
const ITEMS_TITLE_TO_FIELD_GAP = 5;

// 2x rasterization keeps embedded SVG-derived PNGs sharp on HiDPI viewers.
const DEFAULT_SVG_DPI_SCALE = 2;

// Inset the AcroForm widget by 1/N of the border-radius so the viewer's
// rectangular field highlight never overflows the rounded rect corner.
const FIELD_INSET_DIVISOR = 3;

const DEFAULT_TITLE_BLOCK_SIZES: TitleBlockSizes = {
    afterSubtitleGap: 4,
    afterTitleGap: 4,
};

const ADDRESS_FIELD_HEIGHT = DEFAULT_FIELD_HEIGHT;
const ADDRESS_FIELD_EXTRA_TOP_GAP = 1;
const ITEMS_DESCRIPTION_HEIGHT = 40;
const FOOTER_HEIGHT = 37;

const FOOTER_TOP_GAP = 5.25; // ~20px
const FOOTER_DISCLAIMER_TO_QR_GAP = 10.5; // ~40px
const DISCLAIMER_LINE_HEIGHT = 3.5;
const DISCLAIMER_TO_LOGO_GAP = 4;
const QR_CAPTION_GAP = 3;

// Fixed vertical cost of everything from "Supplier / Seller Information" through
// the bottom of the page footer. Used to compute the spacer that grows below the
// data section so the receipt always fills exactly one A4 page.
const TAIL_HEIGHT_WITH_TOTAL =
    SECTION_GAP +
    SECTION_TITLE_HEIGHT +
    LABEL_TO_FIELD_GAP +
    POST_FIELD_GAP +
    DEFAULT_FIELD_HEIGHT +
    ADDRESS_FIELD_EXTRA_TOP_GAP +
    LABEL_TO_FIELD_GAP +
    POST_FIELD_GAP +
    ADDRESS_FIELD_HEIGHT +
    POST_SECTION_PADDING +
    SECTION_GAP +
    ITEMS_TITLE_TO_FIELD_GAP +
    ITEMS_DESCRIPTION_HEIGHT +
    ITEMS_TITLE_TO_FIELD_GAP +
    FOOTER_CELL_HEIGHT +
    POST_TOTAL_ROW_PADDING +
    FOOTER_HEIGHT;

const TAIL_HEIGHT_WITHOUT_TOTAL = TAIL_HEIGHT_WITH_TOTAL - FOOTER_CELL_HEIGHT - POST_TOTAL_ROW_PADDING;

const DEFAULT_FOOTER_SIZES: PageFooterSizes = {
    logoSvgHeight: 28,
    logoSvgWidth: 229,
    logoWidth: 50,
    qrPixelWidth: 200,
    qrSize: 25,
};

// jspdf, qrcode, and the Roboto/Roboto Mono TTF fonts are loaded dynamically so
// nothing lands in the main bundle. All three are required — a font-fetch
// failure rejects loadPdfDeps so the caller can surface the error.
export async function loadPdfDeps(onError: (error: unknown) => void): Promise<PdfDeps> {
    const [{ jsPDF: JsPDF }, { toDataURL: qrToDataURL }, fonts] = await Promise.all([
        import('jspdf'),
        import('qrcode'),
        loadPdfFonts(),
    ]);
    return { JsPDF, fonts, onError, qrToDataURL };
}

export function applyDocFonts(doc: jsPDF, deps: PdfDeps): void {
    registerPdfFonts(doc, deps.fonts);
}

// Constructs an A4 jsPDF doc, registers the custom fonts on it, and draws the
// "Solana Payment Receipt / On-chain Transaction Record" header block.
// Both single- and multi-transfer generators start the same way.
export function initReceiptDoc(deps: PdfDeps, clusterLabel?: string): { doc: jsPDF; y: number } {
    const doc = new deps.JsPDF({ format: 'a4', unit: 'mm' });
    applyDocFonts(doc, deps);
    const y = drawTitleBlock(doc, PAGE_TOP_Y, DEFAULT_TITLE_BLOCK_SIZES, clusterLabel);
    return { doc, y };
}

// Draws the Jupiter API attribution caption. `x` and `afterGap` differ between
// layouts (single positions it in the right column; multi spans full width).
export function drawJupiterAttribution(doc: jsPDF, x: number, y: number, afterGap: number): number {
    applyTextStyle(doc, TEXT_STYLES.caption);
    doc.text(JUPITER_ATTRIBUTION, x, y);
    return y + afterGap;
}

export function addSectionGap(y: number): number {
    return y + SECTION_GAP;
}

export function labeledFieldHeight(fieldHeight: number): number {
    return LABEL_TO_FIELD_GAP + POST_FIELD_GAP + fieldHeight;
}

export function ensurePageSpace(doc: jsPDF, y: number, needed: number): number {
    if (y + needed > PAGE.height - PAGE_BOTTOM_PADDING) {
        doc.addPage();
        return PAGE_TOP_Y;
    }
    return y;
}

export function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
    applyTextStyle(doc, TEXT_STYLES.sectionTitle);
    doc.text(title, PAGE.marginX, y);
    return y + SECTION_TITLE_HEIGHT;
}

export function fitFontSize(doc: jsPDF, text: string, maxWidth: number, baseSize: number): number {
    doc.setFontSize(baseSize);
    const w = doc.getTextWidth(text);
    return w > maxWidth ? baseSize * (maxWidth / w) : baseSize;
}

export async function svgToDataUrl(
    svg: string,
    width: number,
    height: number,
    dpiScale: number = DEFAULT_SVG_DPI_SCALE,
): Promise<string> {
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
        canvas.width = width * dpiScale;
        canvas.height = height * dpiScale;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context unavailable');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        return canvas.toDataURL('image/png');
    } finally {
        URL.revokeObjectURL(url);
    }
}

export function addEditableField(
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
    const inset = BORDER_RADIUS / FIELD_INSET_DIVISOR;
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

export function drawLabeledField(
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

export function drawTotalRow(doc: jsPDF, label: string, fieldName: string, value: string, y: number): number {
    applyTextStyle(doc, TEXT_STYLES.sectionTitle);
    doc.text(label, FOOTER_FIELD_X - TOTAL_LABEL_TO_FIELD_GAP, y + FOOTER_CELL_HEIGHT / 2, {
        align: 'right',
        baseline: 'middle',
    });
    addEditableField(doc, fieldName, FOOTER_FIELD_X, y, FOOTER_FIELD_WIDTH, FOOTER_CELL_HEIGHT, value, false, 0, true);
    return y + FOOTER_CELL_HEIGHT + POST_TOTAL_ROW_PADDING;
}

export function drawTitleBlock(
    doc: jsPDF,
    y: number,
    sizes: TitleBlockSizes = DEFAULT_TITLE_BLOCK_SIZES,
    clusterLabel?: string,
): number {
    applyTextStyle(doc, TEXT_STYLES.title);
    doc.text('Solana Payment Receipt', PAGE.marginX, y);
    y += sizes.afterTitleGap;
    applyTextStyle(doc, TEXT_STYLES.subtitle);
    const subtitle = clusterLabel ? `On-chain Transaction Record — ${clusterLabel}` : 'On-chain Transaction Record';
    doc.text(subtitle, PAGE.marginX, y);
    return y + sizes.afterSubtitleGap;
}

export function drawDetailCell(
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

// Draws the Signature cell in the left detail column. When `transactionUrl` is
// provided, overlays an invisible clickable link annotation hugging the
// signature value lines (not the label or trailing gap).
export function drawSignatureCell(doc: jsPDF, signature: string, y: number, transactionUrl?: string): number {
    applyTextStyle(doc, TEXT_STYLES.valueMono);
    const lines = doc.splitTextToSize(signature, GRID.col.innerWidth) as string[];
    const startY = y;
    const bottom = drawDetailCell(doc, 'Signature', lines, DETAILS_COL1_X, y, TEXT_STYLES.valueMono);
    if (transactionUrl) {
        const linkH = bottom - (startY + DETAIL_LABEL_TO_VALUE_GAP) + SIG_LINK_HEIGHT_PADDING;
        doc.link(DETAILS_COL1_X, startY + SIG_LINK_TOP_INSET, GRID.col.innerWidth, linkH, { url: transactionUrl });
    }
    return bottom;
}

// Draws the Memo cell in the right detail column. Memo is truncated to
// MEMO_MAX_CHARS and rendered as "-" when missing.
export function drawMemoCell(doc: jsPDF, memo: string | undefined | null, y: number): number {
    applyTextStyle(doc, TEXT_STYLES.valueMono);
    const lines = doc.splitTextToSize(truncateMemo(memo), GRID.col.innerWidth) as string[];
    return drawDetailCell(doc, 'Memo', lines, DETAILS_COL2_X, y, TEXT_STYLES.valueMono);
}

// Inline "ⓘ Equivalent on report date (… UTC), not transaction date" — drawn
// under the Amount USD value. Caller passes the y at which the icon top sits.
export async function drawJupiterEquivalentCaption(
    deps: PdfDeps,
    doc: jsPDF,
    x: number,
    y: number,
    reportDateUtc: string,
): Promise<number> {
    const text = `Equivalent on report date (${reportDateUtc}), not transaction date`;

    try {
        const iconUrl = await svgToDataUrl(INFO_CIRCLE_SVG, JUPITER_ICON_NATIVE_SIZE, JUPITER_ICON_NATIVE_SIZE);
        doc.addImage(iconUrl, 'PNG', x, y, JUPITER_ICON_SIZE, JUPITER_ICON_SIZE);
    } catch (error) {
        deps.onError(error);
    }

    applyTextStyle(doc, TEXT_STYLES.caption);
    const textX = x + JUPITER_ICON_SIZE + JUPITER_ICON_TO_TEXT_GAP;
    // Baseline-align the caption with the icon's vertical center.
    const textBaselineY = y + JUPITER_ICON_SIZE * 0.85;
    doc.text(text, textX, textBaselineY);

    return textBaselineY;
}

export function drawSupplierAndItems(doc: jsPDF, y: number, includeTotalRow = true): number {
    // Anchor the bottom: if the data section above used less than the page can
    // hold, the extra space falls naturally between data and this section
    // (visible as a blank stretch below the transfers/payment-details).
    const tailHeight = includeTotalRow ? TAIL_HEIGHT_WITH_TOTAL : TAIL_HEIGHT_WITHOUT_TOTAL;
    const bottomAnchorY = PAGE.height - PAGE_BOTTOM_PADDING - tailHeight;
    y = Math.max(y, bottomAnchorY);

    y = addSectionGap(y);
    y = drawSectionTitle(doc, 'Supplier / Seller Information', y);
    y = drawLabeledField(doc, 'Full name', 'supplier_name', y);
    y += ADDRESS_FIELD_EXTRA_TOP_GAP;
    y = drawLabeledField(doc, 'Address', 'supplier_address', y, '', true, ADDRESS_FIELD_HEIGHT);
    y += POST_SECTION_PADDING;

    y = addSectionGap(y);
    applyTextStyle(doc, TEXT_STYLES.sectionTitle);
    doc.text('Items / Services', PAGE.marginX, y);
    y += 3;
    addEditableField(doc, 'items_description', PAGE.marginX, y, PAGE.contentWidth, ITEMS_DESCRIPTION_HEIGHT, '', true);
    y += ITEMS_DESCRIPTION_HEIGHT + ITEMS_TITLE_TO_FIELD_GAP;

    if (!includeTotalRow) {
        return y;
    }

    return drawTotalRow(doc, 'Total', 'total', '', y);
}

export async function drawPageFooter(
    deps: PdfDeps,
    doc: jsPDF,
    receiptUrl: string,
    y: number,
    sizes: PageFooterSizes = DEFAULT_FOOTER_SIZES,
): Promise<void> {
    y = ensurePageSpace(doc, y, FOOTER_HEIGHT);
    y += FOOTER_TOP_GAP;

    const qrX = PAGE.marginX + PAGE.contentWidth - sizes.qrSize;
    const disclaimerWidth = qrX - FOOTER_DISCLAIMER_TO_QR_GAP - PAGE.marginX;

    applyTextStyle(doc, TEXT_STYLES.disclaimer);
    const disclaimer =
        'This receipt was automatically generated by Solana Explorer based on publicly available on-chain transaction data. ' +
        'On-chain data (addresses, amounts, dates, signatures) is pre-filled from the blockchain. ' +
        'Editable fields (supplier info, items) are provided for the user to complete manually. ' +
        'This receipt is not a tax invoice unless completed with appropriate details.';
    const disclaimerLines = doc.splitTextToSize(disclaimer, disclaimerWidth);
    doc.text(disclaimerLines, PAGE.marginX, y, { baseline: 'top' });

    try {
        const qrDataUrl = await deps.qrToDataURL(receiptUrl, { margin: 0, width: sizes.qrPixelWidth });
        doc.addImage(qrDataUrl, 'PNG', qrX, y, sizes.qrSize, sizes.qrSize);
        applyTextStyle(doc, TEXT_STYLES.caption);
        doc.text('Verify on Solana Explorer', qrX + sizes.qrSize / 2, y + sizes.qrSize + QR_CAPTION_GAP, {
            align: 'center',
        });
    } catch (error) {
        deps.onError(error);
    }

    const logoY = y + disclaimerLines.length * DISCLAIMER_LINE_HEIGHT + DISCLAIMER_TO_LOGO_GAP;
    try {
        const logoDataUrl = await svgToDataUrl(LOGO_SVG, sizes.logoSvgWidth, sizes.logoSvgHeight);
        const logoHeight = (sizes.logoSvgHeight / sizes.logoSvgWidth) * sizes.logoWidth;
        doc.addImage(logoDataUrl, 'PNG', PAGE.marginX, logoY, sizes.logoWidth, logoHeight);
    } catch (error) {
        deps.onError(error);
        applyTextStyle(doc, TEXT_STYLES.logoFallback);
        doc.text('Solana Explorer', PAGE.marginX, logoY + 4);
    }
}
