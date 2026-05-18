import type { jsPDF } from 'jspdf';

import { getReceiptSymbol } from '@/app/entities/token-receipt';

import type { FormattedReceipt } from '../types';
import {
    applyLineStyle,
    applyTextStyle,
    formatText,
    LINE_STYLES,
    PAGE,
    TEXT_STYLES,
    type TextStyle,
} from './generate-receipt-pdf-styles';
import {
    drawJupiterAttribution,
    drawPageFooter,
    drawSectionTitle,
    drawSupplierAndItems,
    fitFontSize,
    initReceiptDoc,
    type PdfDeps,
    POST_TITLE_PADDING,
} from './pdf-shared';

const STACKED_ROW_LABEL_GAP = 3.5;
const STACKED_ROW_AFTER = 6;
const POST_DIVIDER_GAP = 5;
const POST_USD_VALUE_GAP = 3; // gap between Amount (USD) value baseline and Jupiter attribution caption

// Signature link rectangle: vertical inset from the row start, and rectangle height.
const SIG_LINK_TOP_INSET = 3;
const SIG_LINK_HEIGHT = 5;

function drawDivider(doc: jsPDF, y: number): number {
    applyLineStyle(doc, LINE_STYLES.divider);
    doc.line(PAGE.marginX, y, PAGE.marginX + PAGE.contentWidth, y);
    return y + POST_DIVIDER_GAP;
}

function drawStackedRow(
    doc: jsPDF,
    label: string,
    value: string,
    y: number,
    style: TextStyle = TEXT_STYLES.value,
): number {
    applyTextStyle(doc, TEXT_STYLES.paymentLabel);
    doc.text(formatText(label, TEXT_STYLES.paymentLabel), PAGE.marginX, y);
    y += STACKED_ROW_LABEL_GAP;

    applyTextStyle(doc, style);
    const fittedSize = fitFontSize(doc, value, PAGE.contentWidth, style.size);
    doc.setFontSize(fittedSize);
    doc.text(value, PAGE.marginX, y);
    doc.setFontSize(style.size);

    return y + STACKED_ROW_AFTER;
}

export async function generateSingleTransferPdf(
    deps: PdfDeps,
    receipt: FormattedReceipt,
    signature: string,
    receiptUrl: string,
    transactionUrl?: string,
    usdValue?: string,
): Promise<void> {
    let { doc, y } = initReceiptDoc(deps);

    y = drawDivider(doc, y);
    y = drawSectionTitle(doc, 'Payment Details', y);
    y += POST_TITLE_PADDING;

    const symbol = getReceiptSymbol(receipt);
    const paymentMethod = symbol ? `Solana (${symbol})` : 'Solana (SOL)';
    const col2X = PAGE.marginX + PAGE.contentWidth / 2;

    applyTextStyle(doc, TEXT_STYLES.paymentLabel);
    doc.text(formatText('Payment Method', TEXT_STYLES.paymentLabel), PAGE.marginX, y);
    doc.text(formatText('Payment Date', TEXT_STYLES.paymentLabel), col2X, y);
    y += STACKED_ROW_LABEL_GAP;
    applyTextStyle(doc, TEXT_STYLES.totalLabel);
    doc.text(paymentMethod, PAGE.marginX, y);
    applyTextStyle(doc, TEXT_STYLES.value);
    doc.text(receipt.date.utc, col2X, y);
    y += STACKED_ROW_AFTER;

    if (usdValue) {
        applyTextStyle(doc, TEXT_STYLES.paymentLabel);
        doc.text(formatText('Original Amount', TEXT_STYLES.paymentLabel), PAGE.marginX, y);
        doc.text(formatText('Amount (USD)', TEXT_STYLES.paymentLabel), col2X, y);
        y += STACKED_ROW_LABEL_GAP;
        applyTextStyle(doc, TEXT_STYLES.totalLabel);
        doc.text(`${receipt.total.formatted} ${receipt.total.unit}`, PAGE.marginX, y);
        doc.text(usdValue, col2X, y);
        y += POST_USD_VALUE_GAP;
        y = drawJupiterAttribution(doc, col2X, y, STACKED_ROW_AFTER);
    } else {
        y = drawStackedRow(
            doc,
            'Original Amount',
            `${receipt.total.formatted} ${receipt.total.unit}`,
            y,
            TEXT_STYLES.totalLabel,
        );
    }

    y = drawStackedRow(doc, 'Network Fee', `${receipt.fee.formatted} SOL`, y);
    y = drawStackedRow(doc, 'Sender Wallet Address', receipt.sender.address, y, TEXT_STYLES.valueMono);
    y = drawStackedRow(doc, 'Receiver Wallet Address', receipt.receiver.address, y, TEXT_STYLES.valueMono);

    const sigStartY = y;
    y = drawStackedRow(doc, 'Transaction Signature', signature, y, TEXT_STYLES.valueMono);
    if (transactionUrl) {
        doc.link(PAGE.marginX, sigStartY + SIG_LINK_TOP_INSET, PAGE.contentWidth, SIG_LINK_HEIGHT, {
            url: transactionUrl,
        });
    }

    if (receipt.memo) {
        y = drawStackedRow(doc, 'Transaction Memo', receipt.memo, y);
    }

    y = drawSupplierAndItems(doc, receipt, y);
    await drawPageFooter(deps, doc, receiptUrl, y);

    doc.save(`solana-receipt-${signature}.pdf`);
}
