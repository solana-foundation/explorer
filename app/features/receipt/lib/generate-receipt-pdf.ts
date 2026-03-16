import type { AcroFormTextField, jsPDF } from 'jspdf';
import type { toDataURL as ToDataURL } from 'qrcode';

import type { FormattedReceipt } from '../types';
import {
    applyLineStyle,
    applyTextStyle,
    COLORS,
    formatText,
    LINE_STYLES,
    PAGE,
    TEXT_STYLES,
    type TextStyle,
} from './generate-receipt-pdf-styles';
import { LOGO_SVG } from './logo-svg';

export type PdfDeps = {
    JsPDF: typeof import('jspdf').jsPDF;
    qrToDataURL: typeof ToDataURL;
};

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

function drawDivider(doc: jsPDF, y: number): number {
    applyLineStyle(doc, LINE_STYLES.divider);
    doc.line(PAGE.marginX, y, PAGE.marginX + PAGE.contentWidth, y);
    return y + 6;
}

function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
    applyTextStyle(doc, TEXT_STYLES.sectionTitle);
    doc.text(title, PAGE.marginX, y);
    return y + 6;
}

function drawStackedRow(
    doc: jsPDF,
    label: string,
    value: string,
    y: number,
    style: TextStyle = TEXT_STYLES.value
): number {
    applyTextStyle(doc, TEXT_STYLES.label);
    doc.text(formatText(label, TEXT_STYLES.label), PAGE.marginX, y);
    y += 4;

    applyTextStyle(doc, style);
    const textWidth = doc.getTextWidth(value);
    if (textWidth > PAGE.contentWidth) {
        doc.setFontSize(style.size * (PAGE.contentWidth / textWidth));
    }
    doc.text(value, PAGE.marginX, y);
    doc.setFontSize(style.size); // reset after potential overflow scaling

    return y + 8;
}

const CELL_RADIUS = 1.5;

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
    fontSize = 8
): void {
    doc.setFillColor(COLORS.fieldBg);
    applyLineStyle(doc, LINE_STYLES.border);
    doc.roundedRect(x, y, width, height, CELL_RADIUS, CELL_RADIUS, 'FD');

    const TextField = doc.AcroForm.TextField as unknown as new () => AcroFormTextField;
    const field = new TextField();
    field.fieldName = fieldName;
    field.multiline = multiline;
    // Inset the widget annotation inside the rounded rect so the viewer's
    // rectangular field highlight doesn't overflow the rounded corners
    const inset = CELL_RADIUS / 3;
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
    height = 6
): number {
    applyTextStyle(doc, TEXT_STYLES.label);
    doc.text(formatText(label, TEXT_STYLES.label), PAGE.marginX, y);

    y += 1;

    addEditableField(doc, fieldName, PAGE.marginX, y, PAGE.contentWidth, height, defaultValue, multiline);
    return y + 4 + height;
}

const FOOTER_LABEL_X = PAGE.marginX + 90;
const FOOTER_FIELD_X = FOOTER_LABEL_X + 30;
const FOOTER_FIELD_WIDTH = PAGE.marginX + PAGE.contentWidth - FOOTER_FIELD_X;
const FOOTER_FONT_SIZE = 10;
const FOOTER_CELL_HEIGHT = 6;

function drawTotalRow(doc: jsPDF, label: string, fieldName: string, value: string, y: number): number {
    applyTextStyle(doc, TEXT_STYLES.totalLabel);
    doc.text(label, FOOTER_LABEL_X, y + FOOTER_CELL_HEIGHT / 2 + 1);
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
        FOOTER_FONT_SIZE
    );
    return y + FOOTER_CELL_HEIGHT + 6;
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
    usdValue?: string
): Promise<void> {
    const doc = new deps.JsPDF({ format: 'a4', unit: 'mm' });

    let y = 20;

    // Title
    applyTextStyle(doc, TEXT_STYLES.title);
    doc.text('Solana Payment Receipt', PAGE.marginX, y);
    y += 4;

    applyTextStyle(doc, TEXT_STYLES.subtitle);
    doc.text('On-chain Transaction Record', PAGE.marginX, y);
    y += 4;

    // ----- PAYMENT DETAILS -----
    y = drawDivider(doc, y);
    y = drawSectionTitle(doc, 'Payment Details', y);
    y += 2;

    const paymentMethod = 'mint' in receipt && receipt.symbol ? `Solana (${receipt.symbol})` : 'Solana (SOL)';
    const col2X = PAGE.marginX + PAGE.contentWidth / 2;

    // Row 1: Payment Method (left) + Payment Date (right) — stacked 2-column
    applyTextStyle(doc, TEXT_STYLES.label);
    doc.text(formatText('Payment Method', TEXT_STYLES.label), PAGE.marginX, y);
    doc.text(formatText('Payment Date', TEXT_STYLES.label), col2X, y);
    y += 4;
    applyTextStyle(doc, TEXT_STYLES.totalLabel);
    doc.text(paymentMethod, PAGE.marginX, y);
    applyTextStyle(doc, TEXT_STYLES.value);
    doc.text(receipt.date.utc, col2X, y);
    y += 8;

    // Row 2: Original Amount (left) + Amount USD (right, if available)
    if (usdValue) {
        applyTextStyle(doc, TEXT_STYLES.label);
        doc.text(formatText('Original Amount', TEXT_STYLES.label), PAGE.marginX, y);
        doc.text(formatText('Amount (USD)', TEXT_STYLES.label), col2X, y);
        y += 4;
        applyTextStyle(doc, TEXT_STYLES.totalLabel);
        doc.text(`${receipt.total.formatted} ${receipt.total.unit}`, PAGE.marginX, y);
        doc.text(usdValue, col2X, y);
        y += 4;
        applyTextStyle(doc, TEXT_STYLES.caption);
        doc.text('Estimated current value at time of download provided by Jupiter API', col2X, y);
        y += 8;
    } else {
        y = drawStackedRow(
            doc,
            'Original Amount',
            `${receipt.total.formatted} ${receipt.total.unit}`,
            y,
            TEXT_STYLES.totalLabel
        );
    }

    y = drawStackedRow(doc, 'Network Fee', `${receipt.fee.formatted} SOL`, y);
    y = drawStackedRow(doc, 'Sender Wallet Address', receipt.sender.address, y, TEXT_STYLES.valueMono);
    y = drawStackedRow(doc, 'Receiver Wallet Address', receipt.receiver.address, y, TEXT_STYLES.valueMono);

    // Transaction Signature — clickable if transactionUrl provided
    const sigStartY = y;
    y = drawStackedRow(doc, 'Transaction Signature', signature, y, TEXT_STYLES.valueMono);
    if (transactionUrl) {
        doc.link(PAGE.marginX, sigStartY + 3, PAGE.contentWidth, 5, { url: transactionUrl });
    }

    if (receipt.memo) {
        y = drawStackedRow(doc, 'Transaction Memo', receipt.memo, y);
    }

    y -= 2;
    // ----- END PAYMENT DETAILS -----

    // ----- SUPPLIER / SELLER -----
    y = drawDivider(doc, y);
    y = drawSectionTitle(doc, 'Supplier / Seller Information', y);
    y += 2;

    const ADDRESS_HEIGHT = 12;
    y = drawLabeledField(doc, 'Full Name', 'supplier_name', y);
    y = drawLabeledField(doc, 'Address', 'supplier_address', y, '', true, ADDRESS_HEIGHT);
    y += 2;
    // ----- END SUPPLIER / SELLER -----

    // ----- ITEMS / SERVICES -----
    y = drawDivider(doc, y);
    y = drawSectionTitle(doc, 'Items / Services', y);

    const DESCRIPTION_HEIGHT = 54;
    addEditableField(doc, 'items_description', PAGE.marginX, y, PAGE.contentWidth, DESCRIPTION_HEIGHT, '', true);
    y += DESCRIPTION_HEIGHT + 2;

    y = drawTotalRow(doc, 'TOTAL', 'total', `${receipt.total.formatted} ${receipt.total.unit}`, y);
    // ----- END ITEMS / SERVICES -----

    // add a new page if the footer won't fit
    const FOOTER_HEIGHT = 55; // divider + disclaimer + logo/QR + caption
    if (y > PAGE.height - FOOTER_HEIGHT) {
        doc.addPage();
        y = 20;
    }
    y = drawDivider(doc, y);

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
    } catch {
        // Fallback: render text if canvas is unavailable (e.g. in tests)
        applyTextStyle(doc, TEXT_STYLES.logoFallback);
        doc.text('Solana Explorer', PAGE.marginX, y + 4);
    }

    try {
        const qrDataUrl = await deps.qrToDataURL(receiptUrl, { margin: 0, width: 200 });
        doc.addImage(qrDataUrl, 'PNG', qrX, y, qrSize, qrSize);
        applyTextStyle(doc, TEXT_STYLES.caption);
        doc.text('Verify on Solana Explorer', qrX + qrSize / 2, y + qrSize + 3, { align: 'center' });
    } catch {
        // Skip QR code silently if generation fails
    }

    doc.save(`solana-receipt-${signature}.pdf`);
}
