import type { FormattedReceipt } from '../types';

const COLORS = {
    border: '#cccccc',
    dark: '#1a1a1a',
    divider: '#e5e5e5',
    fieldBg: '#f5f5f5',
    light: '#999999',
    mid: '#555555',
} as const;

const PAGE = {
    contentWidth: 170,
    height: 297,
    marginX: 20,
    width: 210,
} as const;

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="229" height="28" fill="none" viewBox="0 0 229 28">
  <mask id="a" width="229" height="28" x="0" y="0" maskUnits="userSpaceOnUse" style="mask-type:luminance">
    <path fill="#fff" d="M228.83 0H0v27.538h228.83z"/>
  </mask>
  <g mask="url(#a)">
    <path fill="#1a1a1a" d="M67.472 11.015h-16.68V5.508H71.79V0H50.753a5.53 5.53 0 0 0-3.895 1.602 5.45 5.45 0 0 0-1.614 3.867v5.584c0 1.451.58 2.842 1.614 3.868a5.53 5.53 0 0 0 3.895 1.602h16.68v5.508H45.641v5.507h21.831a5.53 5.53 0 0 0 3.896-1.602 5.45 5.45 0 0 0 1.613-3.867v-5.584c0-1.45-.58-2.842-1.613-3.868a5.53 5.53 0 0 0-3.896-1.602M99.775 0H83.033a5.5 5.5 0 0 0-2.108.416 5.5 5.5 0 0 0-2.979 2.96 5.4 5.4 0 0 0-.418 2.093v16.6a5.44 5.44 0 0 0 1.611 3.867 5.5 5.5 0 0 0 1.786 1.186 5.5 5.5 0 0 0 2.108.416h16.742a5.53 5.53 0 0 0 3.896-1.602 5.45 5.45 0 0 0 1.613-3.867v-16.6a5.45 5.45 0 0 0-1.613-3.867A5.53 5.53 0 0 0 99.775 0m-.038 22.03H83.095V5.509h16.642zM158.369 0h-16.326a5.53 5.53 0 0 0-3.895 1.602 5.45 5.45 0 0 0-1.614 3.867v22.07h5.547v-9.05h16.25v9.05h5.547V5.468a5.44 5.44 0 0 0-1.613-3.868 5.5 5.5 0 0 0-1.787-1.186A5.5 5.5 0 0 0 158.369 0m-.038 12.981h-16.25V5.508h16.25zM223.32 0h-16.322a5.55 5.55 0 0 0-3.903 1.598 5.46 5.46 0 0 0-1.617 3.871v22.07h5.547v-9.05h16.257v9.05h5.547V5.468c0-1.45-.58-2.841-1.614-3.867A5.53 5.53 0 0 0 223.32 0m-.038 12.981h-16.246V5.508h16.246zm-32.278 9.049h-2.219l-7.951-19.735a3.66 3.66 0 0 0-1.35-1.667 3.7 3.7 0 0 0-2.06-.628h-4.938c-.974 0-1.908.384-2.596 1.068a3.63 3.63 0 0 0-1.076 2.577v23.893h5.547V5.508h2.22l7.947 19.735a3.65 3.65 0 0 0 1.348 1.668 3.7 3.7 0 0 0 2.057.627h4.939c.974 0 1.908-.384 2.596-1.067a3.63 3.63 0 0 0 1.075-2.578V0h-5.547zM115.747 0h-5.548v22.069c0 1.45.58 2.842 1.614 3.867a5.53 5.53 0 0 0 3.895 1.602h16.681v-5.507h-16.642z"/>
    <g clip-path="url(#c)" transform="scale(0.4375)">
      <path d="M70.6648 50.1769L58.9393 62.775C58.6844 63.0486 58.376 63.2668 58.0332 63.4159C57.6905 63.5651 57.3208 63.6419 56.9472 63.6417H1.36128C1.09605 63.6417 0.836598 63.5641 0.614804 63.4184C0.393011 63.2727 0.218536 63.0652 0.112817 62.8215C0.00709765 62.5779-0.0252603 62.3085 0.0197186 62.0467C0.0646974 61.7848 0.185054 61.5418 0.366 61.3476L12.1006 48.7496C12.3548 48.4766 12.6623 48.2589 13.0039 48.1098C13.3455 47.9607 13.714 47.8834 14.0866 47.8828H69.6695C69.9348 47.8828 70.1942 47.9604 70.416 48.1062C70.6378 48.2519 70.8123 48.4593 70.918 48.703C71.0237 48.9467 71.0561 49.216 71.0111 49.4778C70.9661 49.7397 70.8458 49.9827 70.6648 50.1769ZM58.9393 24.8081C58.6844 24.5345 58.376 24.3163 58.0332 24.1672C57.6905 24.0181 57.3208 23.9412 56.9472 23.9414H1.36128C1.09605 23.9414 0.836598 24.019 0.614804 24.1647C0.393011 24.3105 0.218536 24.5179 0.112817 24.7616C0.00709765 25.0053-0.0252603 25.2746 0.0197186 25.5364C0.0646974 25.7983 0.185054 26.0413 0.366 26.2355L12.1006 38.8336C12.3548 39.1065 12.6623 39.3242 13.0039 39.4733C13.3455 39.6224 13.714 39.6997 14.0866 39.7003H69.6695C69.9348 39.7003 70.1942 39.6227 70.416 39.477C70.6378 39.3313 70.8123 39.1238 70.918 38.8801C71.0237 38.6365 71.0561 38.3671 71.0111 38.1053C70.9661 37.8434 70.8458 37.6004 70.6648 37.4062L58.9393 24.8081ZM1.36128 15.7589H56.9472C57.3208 15.7591 57.6905 15.6822 58.0332 15.5331C58.376 15.384 58.6844 15.1658 58.9393 14.8922L70.6648 2.29413C70.8458 2.09986 70.9661 1.85688 71.0111 1.59502C71.0561 1.33317 71.0237 1.06385 70.918 0.820169C70.8123 0.576485 70.6378 0.369047 70.416 0.223341C70.1942 0.0776352 69.9348 0 69.6695 0L14.0866 0C13.714 0.000635 13.3455 0.077888 13.0039 0.226975C12.6623 0.376063 12.3548 0.593811 12.1006 0.866739L0.369025 13.4648C0.188254 13.6588 0.0679503 13.9016 0.0228694 14.1631C-0.0222115 14.4247 0.00988974 14.6938 0.115236 14.9373C0.220583 15.1809 0.394595 15.3884 0.615931 15.5343C0.837268 15.6802 1.09631 15.7583 1.36128 15.7589Z" fill="url(#g)"/>
    </g>
  </g>
  <defs>
    <linearGradient id="g" x1="5.99583" y1="65.1585" x2="64.404" y2="-0.566497" gradientUnits="userSpaceOnUse">
      <stop offset="0.08" stop-color="#9945FF"/>
      <stop offset="0.3" stop-color="#8752F3"/>
      <stop offset="0.5" stop-color="#5497D5"/>
      <stop offset="0.6" stop-color="#43B4CA"/>
      <stop offset="0.72" stop-color="#28E0B9"/>
      <stop offset="0.97" stop-color="#19FB9B"/>
    </linearGradient>
    <clipPath id="c"><rect width="71.0308" height="63.6417" fill="white"/></clipPath>
  </defs>
</svg>`;

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

function drawDivider(doc: import('jspdf').jsPDF, y: number): number {
    doc.setDrawColor(COLORS.divider);
    doc.setLineWidth(0.3);
    doc.line(PAGE.marginX, y, PAGE.marginX + PAGE.contentWidth, y);
    return y + 6;
}

function drawSectionTitle(doc: import('jspdf').jsPDF, title: string, y: number): number {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(COLORS.dark);
    doc.text(title, PAGE.marginX, y);
    return y + 6;
}

function drawDetailRow(doc: import('jspdf').jsPDF, label: string, value: string, y: number): number {
    const labelX = PAGE.marginX;
    const valueX = PAGE.marginX + 55;
    const maxValueWidth = PAGE.contentWidth - 55;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.mid);
    doc.text(label, labelX, y);

    doc.setTextColor(COLORS.dark);
    const lines = doc.splitTextToSize(value, maxValueWidth);
    doc.text(lines, valueX, y);

    return y + lines.length * 4 + 2;
}

function addEditableField(
    doc: import('jspdf').jsPDF,
    fieldName: string,
    x: number,
    y: number,
    width: number,
    height: number,
    defaultValue = ''
): void {
    doc.setFillColor(COLORS.fieldBg);
    doc.rect(x, y, width, height, 'F');
    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(0.2);
    doc.rect(x, y, width, height, 'S');

    const TextField = doc.AcroForm.TextField as unknown as new () => import('jspdf').AcroFormTextField;
    const field = new TextField();
    field.fieldName = fieldName;
    field.x = x;
    field.y = y;
    field.width = width;
    field.height = height;
    field.fontSize = 8;
    field.defaultValue = defaultValue;
    field.value = defaultValue;
    doc.addField(field);
}

function drawLabeledField(
    doc: import('jspdf').jsPDF,
    label: string,
    fieldName: string,
    y: number,
    defaultValue = ''
): number {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.mid);
    doc.text(label, PAGE.marginX, y);

    addEditableField(doc, fieldName, PAGE.marginX + 55, y - 3, PAGE.contentWidth - 55, 6, defaultValue);
    return y + 8;
}

export async function generateReceiptPdf(receipt: FormattedReceipt, signature: string, receiptUrl: string): Promise<void> {
    const [{ jsPDF }, QRCode] = await Promise.all([import('jspdf'), import('qrcode')]);
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });

    let y = 25;

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(COLORS.dark);
    doc.text('Solana Payment Receipt', PAGE.marginX, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.light);
    doc.text('On-chain Transaction Record', PAGE.marginX, y);
    y += 10;

    // Payment Details
    y = drawDivider(doc, y);
    y = drawSectionTitle(doc, 'Payment Details', y);
    y += 2;

    y = drawDetailRow(doc, 'Payment Method', 'Solana Blockchain', y);
    y = drawDetailRow(doc, 'Payment Date', receipt.date.utc, y);
    y = drawDetailRow(doc, 'Original Amount', `${receipt.total.formatted} ${receipt.total.unit}`, y);
    y = drawDetailRow(doc, 'Network Fee', `${receipt.fee.formatted} SOL`, y);
    y = drawDetailRow(doc, 'Sender Address', receipt.sender.address, y);
    y = drawDetailRow(doc, 'Receiver Address', receipt.receiver.address, y);
    y = drawDetailRow(doc, 'Transaction Signature', signature, y);

    if (receipt.memo) {
        y = drawDetailRow(doc, 'Transaction Memo', receipt.memo, y);
    }

    y += 4;

    // Supplier / Seller
    y = drawDivider(doc, y);
    y = drawSectionTitle(doc, 'Supplier / Seller Information', y);
    y += 2;

    y = drawLabeledField(doc, 'Full Name', 'supplier_name', y);
    y = drawLabeledField(doc, 'Address', 'supplier_address', y);
    y += 4;

    // Items / Services table
    y = drawDivider(doc, y);
    y = drawSectionTitle(doc, 'Items / Services', y);
    y += 2;

    const colX = [PAGE.marginX, PAGE.marginX + 60, PAGE.marginX + 85, PAGE.marginX + 110, PAGE.marginX + 140];
    const colW = [58, 23, 23, 28, 30];
    const headers = ['Description', 'Qty', 'Unit Price', 'VAT %', 'Total'];

    // Table header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(COLORS.mid);
    headers.forEach((h, i) => doc.text(h, colX[i], y));
    y += 2;
    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(PAGE.marginX, y, PAGE.marginX + PAGE.contentWidth, y);
    y += 3;

    // 4 editable rows
    const ROW_HEIGHT = 6;
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 5; col++) {
            addEditableField(doc, `item_${row}_${headers[col].toLowerCase().replace(' ', '_')}`, colX[col], y, colW[col], ROW_HEIGHT);
        }
        y += ROW_HEIGHT + 2;
    }

    y += 2;

    // Totals row
    const totalsX = colX[3];
    const totalsValueX = colX[4];
    const totalsValueW = colW[4];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.mid);
    doc.text('Subtotal', totalsX, y + 3);
    addEditableField(doc, 'subtotal', totalsValueX, y, totalsValueW, ROW_HEIGHT);
    y += ROW_HEIGHT + 2;

    doc.text('VAT Amount', totalsX, y + 3);
    addEditableField(doc, 'vat_amount', totalsValueX, y, totalsValueW, ROW_HEIGHT);
    y += ROW_HEIGHT + 2;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.dark);
    doc.text('Total', totalsX, y + 3);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`${receipt.total.formatted} ${receipt.total.unit}`, totalsValueX, y + 3);
    y += ROW_HEIGHT + 6;

    // Footer
    y = drawDivider(doc, y);
    y += 2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(COLORS.light);
    const disclaimer =
        'This document is generated from on-chain Solana blockchain data. ' +
        'Editable fields (supplier info, items, VAT) are provided for the user to complete manually. ' +
        'On-chain data (addresses, amounts, dates) is pre-filled and verified against the blockchain. ' +
        'This receipt is not a tax invoice unless completed with appropriate details.';
    const disclaimerLines = doc.splitTextToSize(disclaimer, PAGE.contentWidth);
    doc.text(disclaimerLines, PAGE.marginX, y);
    y += disclaimerLines.length * 3.5 + 6;

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
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(COLORS.dark);
        doc.text('Solana Explorer', PAGE.marginX, y + 4);
    }

    try {
        const qrDataUrl = await QRCode.toDataURL(receiptUrl, { width: 200, margin: 0 });
        doc.addImage(qrDataUrl, 'PNG', qrX, y, qrSize, qrSize);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(COLORS.light);
        doc.text('Verify on Solana Explorer', qrX + qrSize / 2, y + qrSize + 3, { align: 'center' });
    } catch {
        // Skip QR code silently if generation fails
    }

    doc.save(`solana-receipt-${signature}.pdf`);
}
