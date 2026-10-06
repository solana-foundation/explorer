import { vi } from 'vitest';

import type { FormattedReceipt } from '../../types';
import { generateMultiTransferPdf } from '../generate-multi-transfer-pdf';
import { loadPdfDeps } from '../generate-receipt-pdf';
import {
    buildMultiSolReceipt,
    collectTextFromMock as collectText,
    mockAddField,
    mockAddImage,
    mockJsPDF,
    mockSave,
    mockText,
    mockTextField,
    mockToDataURL,
    PDF_OPTS,
    qrcodeModule,
    SIGNATURE,
    SOL_RECEIPT as RECEIPT,
    stubSvgRasterizationUnsupported,
    SVG_RASTERIZATION_ERROR,
} from './__fixtures__/pdf-mocks';

vi.mock('jspdf', () => ({ jsPDF: mockJsPDF }));
vi.mock('qrcode', () => qrcodeModule);
vi.mock('../pdf-fonts', async () => (await import('./__fixtures__/pdf-mocks')).pdfFontsModule);

describe('generateMultiTransferPdf', () => {
    const mockOnError = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        stubSvgRasterizationUnsupported();
    });

    it('should create jsPDF instance with A4 format', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateMultiTransferPdf(deps, RECEIPT, PDF_OPTS);
        expect(mockJsPDF).toHaveBeenCalledWith({ format: 'a4', unit: 'mm' });
    });

    it('should render transaction details labels and values', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateMultiTransferPdf(deps, RECEIPT, PDF_OPTS);

        const allText = collectText();

        expect(allText).toContain('Solana Payment Receipt');
        expect(allText).toContain('Transaction details');
        expect(allText).toContain('Payment date');
        expect(allText).toContain('2023-11-14 22:13:20 UTC');
        expect(allText).toContain('Network fee');
        expect(allText).toContain('0.000005 SOL');
        expect(allText).toContain('Signature');
        expect(allText).toContain(SIGNATURE);
    });

    it('should render transfers table with sender, receiver, and amount columns', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateMultiTransferPdf(deps, RECEIPT, PDF_OPTS);

        const allText = collectText();

        expect(allText).toContain('Transfers');
        expect(allText).toContain('Sender');
        expect(allText).toContain('Receiver');
        expect(allText).toContain('Amount');
        expect(allText).toContain('SenderAddr111111111111111111111111111111111');
        expect(allText).toContain('ReceiverAddr2222222222222222222222222222222');
    });

    it('should render single-transfer receipt as a single table row', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateMultiTransferPdf(deps, RECEIPT, PDF_OPTS);

        const textCalls = mockText.mock.calls.map(([text]) => (Array.isArray(text) ? text.join(' ') : text));
        const senderOccurrences = textCalls.filter(t => t === RECEIPT.sender.address).length;
        const receiverOccurrences = textCalls.filter(t => t === RECEIPT.receiver.address).length;

        expect(senderOccurrences).toBe(1);
        expect(receiverOccurrences).toBe(1);
    });

    it('should render every transfer when receipt has multiple transfers (<= 18)', async () => {
        const multiReceipt = buildMultiSolReceipt(18);

        const deps = await loadPdfDeps(mockOnError);
        await generateMultiTransferPdf(deps, multiReceipt, PDF_OPTS);

        const allText = collectText();

        for (const transfer of multiReceipt.transfers) {
            expect(allText).toContain(transfer.sender.address);
            expect(allText).toContain(transfer.receiver.address);
        }
        expect(allText).not.toContain('largest transfers are shown here');
    });

    it('should cap visible transfers at 16 and render warning bar when there are more than 18', async () => {
        const multiReceipt = buildMultiSolReceipt(20);
        const { transfers } = multiReceipt;

        const deps = await loadPdfDeps(mockOnError);
        await generateMultiTransferPdf(deps, multiReceipt, PDF_OPTS);

        const allText = collectText();

        for (let i = 0; i < 16; i++) {
            expect(allText).toContain(transfers[i].sender.address);
        }
        // 17th onward should not be rendered
        for (let i = 16; i < 20; i++) {
            expect(allText).not.toContain(transfers[i].sender.address);
        }
        expect(allText).toContain('Only the 16 largest transfers are shown here');
        expect(allText).toContain('full list of 20 transfers');
    });

    it('should pick the 16 largest transfers by amount, regardless of instruction order', async () => {
        // Build 20 transfers where amount.raw is the inverse of the index: index 0 → smallest, index 19 → largest.
        // The 16 largest are therefore indices 19..4 (in any order); indices 0..3 must be excluded.
        const transfers = Array.from({ length: 20 }, (_, i) => ({
            amount: { formatted: `${i + 1}`, raw: (i + 1) * 1_000_000, unit: 'SOL' },
            receiver: {
                address: `Recv${i.toString().padStart(2, '0')}xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`,
                truncated: `R${i}`,
            },
            sender: {
                address: `Send${i.toString().padStart(2, '0')}xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`,
                truncated: `S${i}`,
            },
        }));
        const totalRaw = transfers.reduce((sum, t) => sum + t.amount.raw, 0);
        const multiReceipt: FormattedReceipt = { ...RECEIPT, total: { ...RECEIPT.total, raw: totalRaw }, transfers };

        const deps = await loadPdfDeps(mockOnError);
        await generateMultiTransferPdf(deps, multiReceipt, PDF_OPTS);

        const allText = collectText();

        // The 16 largest are indices 4..19 — all must be present
        for (let i = 4; i < 20; i++) {
            expect(allText).toContain(transfers[i].sender.address);
        }
        // The 4 smallest (indices 0..3) must be excluded
        for (let i = 0; i < 4; i++) {
            expect(allText).not.toContain(transfers[i].sender.address);
        }
    });

    it('should create AcroForm text fields for editable sections', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateMultiTransferPdf(deps, RECEIPT, PDF_OPTS);

        const fieldNames = mockTextField.mock.results.map(r => r.value.fieldName).filter(Boolean);

        expect(fieldNames).toContain('supplier_name');
        expect(fieldNames).toContain('supplier_address');
        expect(fieldNames).toContain('items_description');
        expect(mockAddField).toHaveBeenCalled();
    });

    it('should not render a Total row on the multi-transfer receipt', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateMultiTransferPdf(deps, RECEIPT, PDF_OPTS);

        const fieldNames = mockTextField.mock.results.map(r => r.value.fieldName).filter(Boolean);
        expect(fieldNames).not.toContain('total');

        const allText = collectText();
        expect(allText).not.toContain('Total');
    });

    it('should call doc.save with full signature filename', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateMultiTransferPdf(deps, RECEIPT, PDF_OPTS);

        expect(mockSave).toHaveBeenCalledWith(`solana-receipt-${SIGNATURE}.pdf`);
    });

    it.each([
        { expected: '-', memo: undefined, title: 'with a dash when memo is absent' },
        { expected: 'Payment for services', memo: 'Payment for services', title: 'with its value when present' },
    ])('should render the Memo label $title', async ({ expected, memo }) => {
        const deps = await loadPdfDeps(mockOnError);
        await generateMultiTransferPdf(deps, { ...RECEIPT, memo }, PDF_OPTS);

        const textCalls = mockText.mock.calls.flatMap(([text]) => text);
        expect(textCalls).toContain('Memo');
        expect(textCalls).toContain(expected);
        expect(mockSave).toHaveBeenCalled();
    });

    it('should embed QR code image in the PDF', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateMultiTransferPdf(deps, RECEIPT, PDF_OPTS);

        expect(mockToDataURL).toHaveBeenCalledWith(PDF_OPTS.receiptUrl, { margin: 0, width: 200 });

        const addImageCalls = mockAddImage.mock.calls;
        const qrCall = addImageCalls.find(([dataUrl]) => dataUrl === 'data:image/png;base64,qrcode');
        expect(qrCall).toBeDefined();

        const allText = collectText();
        expect(allText).toContain('Verify on Solana Explorer');
    });

    it.each([
        ['provided', '~200.00 USD'],
        ['not provided', undefined],
    ])('should not render any USD value or Jupiter API attribution when usdValue is %s', async (_, usdValue) => {
        const deps = await loadPdfDeps(mockOnError);
        await generateMultiTransferPdf(deps, RECEIPT, { ...PDF_OPTS, usdValue });

        const allText = collectText();

        expect(allText).not.toContain('~200.00 USD');
        expect(allText).not.toContain('$');
        expect(allText).not.toContain('Jupiter API');
    });

    describe('error paths', () => {
        it('should call onError and render the Solana Explorer text fallback when the logo SVG fails', async () => {
            const deps = await loadPdfDeps(mockOnError);
            await generateMultiTransferPdf(deps, RECEIPT, PDF_OPTS);

            expect(mockSave).toHaveBeenCalledWith(`solana-receipt-${SIGNATURE}.pdf`);
            expect(mockOnError).toHaveBeenCalledWith(SVG_RASTERIZATION_ERROR);
            expect(collectText()).toContain('Solana Explorer');
        });

        it('should call onError when the warning-icon SVG fails on a multi-transfer receipt', async () => {
            const deps = await loadPdfDeps(mockOnError);
            await generateMultiTransferPdf(deps, buildMultiSolReceipt(20), PDF_OPTS);

            expect(mockSave).toHaveBeenCalled();
            // Warning-icon path + logo path both fail → onError invoked at least twice
            expect(mockOnError.mock.calls.length).toBeGreaterThanOrEqual(2);
            expect(mockOnError).toHaveBeenCalledWith(SVG_RASTERIZATION_ERROR);
            // Warning bar text still renders even when its icon failed
            expect(collectText()).toContain('Only the 16 largest transfers are shown here');
        });

        it('should save the PDF even when logo, warning icon, and QR code all fail', async () => {
            const qrError = new Error('QR generation failed');
            mockToDataURL.mockRejectedValueOnce(qrError);

            const deps = await loadPdfDeps(mockOnError);
            await generateMultiTransferPdf(deps, buildMultiSolReceipt(20), PDF_OPTS);

            expect(mockSave).toHaveBeenCalledWith(`solana-receipt-${SIGNATURE}.pdf`);
            const reported = mockOnError.mock.calls.map(([e]) => e as Error);
            expect(reported).toContain(SVG_RASTERIZATION_ERROR);
            const qrReport = reported.find(e => e.message === 'Failed to render QR code in receipt footer');
            expect(qrReport?.cause).toBe(qrError);
        });
    });
});
