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

export type PdfDeps = {
    JsPDF: typeof import('jspdf').jsPDF;
    qrToDataURL: typeof ToDataURL;
};

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="229" height="28" fill="none" viewBox="0 0 229 28"><mask id="a" width="229" height="28" x="0" y="0" maskUnits="userSpaceOnUse" style="mask-type:luminance"><path fill="#fff" d="M228.83 0H0v27.538h228.83z"/></mask><g mask="url(#a)"><path fill="#1a1a1a" d="M67.472 11.015h-16.68V5.508H71.79V0H50.753a5.53 5.53 0 0 0-3.895 1.602 5.45 5.45 0 0 0-1.614 3.867v5.584c0 1.451.58 2.842 1.614 3.868a5.53 5.53 0 0 0 3.895 1.602h16.68v5.508H45.641v5.507h21.831a5.53 5.53 0 0 0 3.896-1.602 5.45 5.45 0 0 0 1.613-3.867v-5.584c0-1.45-.58-2.842-1.613-3.868a5.53 5.53 0 0 0-3.896-1.602M99.775 0H83.033a5.5 5.5 0 0 0-2.108.416 5.5 5.5 0 0 0-2.979 2.96 5.4 5.4 0 0 0-.418 2.093v16.6a5.44 5.44 0 0 0 1.611 3.867 5.5 5.5 0 0 0 1.786 1.186 5.5 5.5 0 0 0 2.108.416h16.742a5.53 5.53 0 0 0 3.896-1.602 5.45 5.45 0 0 0 1.613-3.867v-16.6a5.45 5.45 0 0 0-1.613-3.867A5.53 5.53 0 0 0 99.775 0m-.038 22.03H83.095V5.509h16.642zM158.369 0h-16.326a5.53 5.53 0 0 0-3.895 1.602 5.45 5.45 0 0 0-1.614 3.867v22.07h5.547v-9.05h16.25v9.05h5.547V5.468a5.44 5.44 0 0 0-1.613-3.868 5.5 5.5 0 0 0-1.787-1.186A5.5 5.5 0 0 0 158.369 0m-.038 12.981h-16.25V5.508h16.25zM223.32 0h-16.322a5.55 5.55 0 0 0-3.903 1.598 5.46 5.46 0 0 0-1.617 3.871v22.07h5.547v-9.05h16.257v9.05h5.547V5.468c0-1.45-.58-2.841-1.614-3.867A5.53 5.53 0 0 0 223.32 0m-.038 12.981h-16.246V5.508h16.246zm-32.278 9.049h-2.219l-7.951-19.735a3.66 3.66 0 0 0-1.35-1.667 3.7 3.7 0 0 0-2.06-.628h-4.938c-.974 0-1.908.384-2.596 1.068a3.63 3.63 0 0 0-1.076 2.577v23.893h5.547V5.508h2.22l7.947 19.735a3.65 3.65 0 0 0 1.348 1.668 3.7 3.7 0 0 0 2.057.627h4.939c.974 0 1.908-.384 2.596-1.067a3.63 3.63 0 0 0 1.075-2.578V0h-5.547zM115.747 0h-5.548v22.069c0 1.45.58 2.842 1.614 3.867a5.53 5.53 0 0 0 3.895 1.602h16.681v-5.507h-16.642z"/><g clip-path="url(#b)" transform="scale(.4375)"><path fill="url(#d)" d="M70.665 50.177 58.939 62.775a2.72 2.72 0 0 1-1.992.867H1.361a1.36 1.36 0 0 1-1.248-.82 1.37 1.37 0 0 1 .253-1.474L12.101 48.75a2.72 2.72 0 0 1 1.986-.867h55.582a1.36 1.36 0 0 1 1.249.82 1.37 1.37 0 0 1-.253 1.474M58.939 24.808a2.72 2.72 0 0 0-1.992-.867H1.361a1.36 1.36 0 0 0-1.248.82 1.37 1.37 0 0 0 .253 1.474l11.735 12.599a2.72 2.72 0 0 0 1.986.866h55.582a1.36 1.36 0 0 0 1.249-.82 1.37 1.37 0 0 0-.253-1.474zm-57.578-9.05h55.586a2.72 2.72 0 0 0 1.992-.866L70.665 2.294A1.364 1.364 0 0 0 69.669 0H14.087A2.72 2.72 0 0 0 12.1.867L.369 13.465a1.364 1.364 0 0 0 .992 2.294"/></g></g><defs><linearGradient id="d" x1="5.996" x2="64.404" y1="65.159" y2="-.566" gradientUnits="userSpaceOnUse"><stop offset=".08" stop-color="#9945ff"/><stop offset=".3" stop-color="#8752f3"/><stop offset=".5" stop-color="#5497d5"/><stop offset=".6" stop-color="#43b4ca"/><stop offset=".72" stop-color="#28e0b9"/><stop offset=".97" stop-color="#19fb9b"/></linearGradient><clipPath id="b"><path fill="#fff" d="M0 0h71.031v63.642H0z"/></clipPath></defs></svg>`;

async function svgToDataUrl(svg: string, width: number, height: number): Promise<string> {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

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

    URL.revokeObjectURL(url);
    return canvas.toDataURL('image/png');
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
    const textWidth = (doc.getStringUnitWidth(value) * doc.getFontSize()) / doc.internal.scaleFactor;
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
        doc.text('Estimated value at time of transfer provided by Jupiter API', col2X, y);
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
    y = drawStackedRow(doc, 'Transaction Signature', signature, y, TEXT_STYLES.valueMono);
    if (transactionUrl) {
        const sigY = y - 8;
        doc.link(PAGE.marginX, sigY - 3, PAGE.contentWidth, 5, { url: transactionUrl });
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

    // Footer
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
