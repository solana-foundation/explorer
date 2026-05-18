import type { AcroFormTextField, jsPDF } from 'jspdf';
import type { toDataURL as ToDataURL } from 'qrcode';

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
import { LOGO_SVG } from './logo-svg';
import { loadPdfFonts, type PdfFonts, registerPdfFonts } from './pdf-fonts';

export type PdfDeps = {
    JsPDF: typeof jsPDF;
    fonts: PdfFonts;
    onError: (error: unknown) => void;
    qrToDataURL: typeof ToDataURL;
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

export const PAGE_TOP_Y = 15;
export const PAGE_BOTTOM_PADDING = 14;
export const SECTION_GAP = 4;
export const SECTION_TITLE_HEIGHT = 6;
export const POST_TITLE_PADDING = 2;
export const POST_SECTION_PADDING = 1;
export const LABEL_TO_FIELD_GAP = 1;
export const POST_FIELD_GAP = 3;
export const DEFAULT_FIELD_HEIGHT = 6;
export const POST_TOTAL_ROW_PADDING = 4;
export const FOOTER_CELL_HEIGHT = 6;

const FOOTER_LABEL_X = PAGE.marginX + 90;
const FOOTER_FIELD_X = FOOTER_LABEL_X + 30;
const FOOTER_FIELD_WIDTH = PAGE.marginX + PAGE.contentWidth - FOOTER_FIELD_X;
const FOOTER_FONT_SIZE = 10;

// 2x rasterization keeps embedded SVG-derived PNGs sharp on HiDPI viewers.
const DEFAULT_SVG_DPI_SCALE = 2;

// Inset the AcroForm widget by 1/N of the border-radius so the viewer's
// rectangular field highlight never overflows the rounded rect corner.
const FIELD_INSET_DIVISOR = 3;

const DEFAULT_TITLE_BLOCK_SIZES: TitleBlockSizes = {
    afterSubtitleGap: 4,
    afterTitleGap: 4,
};

const ADDRESS_FIELD_HEIGHT = 10;
const ITEMS_DESCRIPTION_HEIGHT = 40;
const FOOTER_HEIGHT = 42;

// Fixed vertical cost of everything from "Supplier / Seller Information" through
// the bottom of the page footer. Used to compute the spacer that grows below the
// data section so the receipt always fills exactly one A4 page.
const TAIL_HEIGHT =
    SECTION_GAP +
    SECTION_TITLE_HEIGHT +
    POST_TITLE_PADDING +
    LABEL_TO_FIELD_GAP +
    POST_FIELD_GAP +
    DEFAULT_FIELD_HEIGHT +
    LABEL_TO_FIELD_GAP +
    POST_FIELD_GAP +
    ADDRESS_FIELD_HEIGHT +
    POST_SECTION_PADDING +
    SECTION_GAP +
    SECTION_TITLE_HEIGHT +
    ITEMS_DESCRIPTION_HEIGHT +
    POST_TITLE_PADDING +
    FOOTER_CELL_HEIGHT +
    POST_TOTAL_ROW_PADDING +
    FOOTER_HEIGHT;

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
export function initReceiptDoc(deps: PdfDeps): { doc: jsPDF; y: number } {
    const doc = new deps.JsPDF({ format: 'a4', unit: 'mm' });
    applyDocFonts(doc, deps);
    const y = drawTitleBlock(doc, PAGE_TOP_Y);
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

export function drawTitleBlock(doc: jsPDF, y: number, sizes: TitleBlockSizes = DEFAULT_TITLE_BLOCK_SIZES): number {
    applyTextStyle(doc, TEXT_STYLES.title);
    doc.text('Solana Payment Receipt', PAGE.marginX, y);
    y += sizes.afterTitleGap;
    applyTextStyle(doc, TEXT_STYLES.subtitle);
    doc.text('On-chain Transaction Record', PAGE.marginX, y);
    return y + sizes.afterSubtitleGap;
}

export function drawSupplierAndItems(doc: jsPDF, receipt: FormattedReceipt, y: number): number {
    // Anchor the bottom: if the data section above used less than the page can
    // hold, the extra space falls naturally between data and this section
    // (visible as a blank stretch below the transfers/payment-details).
    const bottomAnchorY = PAGE.height - PAGE_BOTTOM_PADDING - TAIL_HEIGHT;
    y = Math.max(y, bottomAnchorY);

    y = addSectionGap(y);
    y = drawSectionTitle(doc, 'Supplier / Seller Information', y);
    y += POST_TITLE_PADDING;
    y = drawLabeledField(doc, 'Full name', 'supplier_name', y);
    y = drawLabeledField(doc, 'Address', 'supplier_address', y, '', true, ADDRESS_FIELD_HEIGHT);
    y += POST_SECTION_PADDING;

    y = addSectionGap(y);
    y = drawSectionTitle(doc, 'Items / Services', y);
    addEditableField(doc, 'items_description', PAGE.marginX, y, PAGE.contentWidth, ITEMS_DESCRIPTION_HEIGHT, '', true);
    y += ITEMS_DESCRIPTION_HEIGHT + POST_TITLE_PADDING;

    return drawTotalRow(doc, 'TOTAL', 'total', `${receipt.total.formatted} ${receipt.total.unit}`, y);
}

export async function drawPageFooter(
    deps: PdfDeps,
    doc: jsPDF,
    receiptUrl: string,
    y: number,
    sizes: PageFooterSizes = DEFAULT_FOOTER_SIZES,
): Promise<void> {
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

    const qrX = PAGE.marginX + PAGE.contentWidth - sizes.qrSize;

    try {
        const logoDataUrl = await svgToDataUrl(LOGO_SVG, sizes.logoSvgWidth, sizes.logoSvgHeight);
        const logoHeight = (sizes.logoSvgHeight / sizes.logoSvgWidth) * sizes.logoWidth;
        doc.addImage(logoDataUrl, 'PNG', PAGE.marginX, y, sizes.logoWidth, logoHeight);
    } catch (error) {
        deps.onError(error);
        applyTextStyle(doc, TEXT_STYLES.logoFallback);
        doc.text('Solana Explorer', PAGE.marginX, y + 4);
    }

    try {
        const qrDataUrl = await deps.qrToDataURL(receiptUrl, { margin: 0, width: sizes.qrPixelWidth });
        doc.addImage(qrDataUrl, 'PNG', qrX, y, sizes.qrSize, sizes.qrSize);
        applyTextStyle(doc, TEXT_STYLES.caption);
        doc.text('Verify on Solana Explorer', qrX + sizes.qrSize / 2, y + sizes.qrSize + 3, { align: 'center' });
    } catch (error) {
        deps.onError(error);
    }
}
