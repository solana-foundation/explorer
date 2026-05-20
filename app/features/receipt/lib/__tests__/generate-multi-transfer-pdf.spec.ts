import { vi } from 'vitest';

import type { FormattedReceipt } from '../../types';
import { generateMultiTransferPdf } from '../generate-multi-transfer-pdf';
import { loadPdfDeps } from '../generate-receipt-pdf';
import {
    collectTextFromMock as collectText,
    mockAddField,
    mockAddImage,
    mockJsPDF,
    mockSave,
    mockText,
    mockTextField,
    mockToDataURL,
    PDF_OPTS,
    SIGNATURE,
    SOL_RECEIPT as RECEIPT,
} from './__fixtures__/pdf-mocks';

vi.mock('jspdf', () => ({ jsPDF: mockJsPDF }));

vi.mock('qrcode', () => ({
    default: { toDataURL: (...args: unknown[]) => mockToDataURL(...args) },
    toDataURL: (...args: unknown[]) => mockToDataURL(...args),
}));

vi.mock('../pdf-fonts', () => ({
    loadPdfFonts: vi.fn().mockResolvedValue({
        robotoMonoRegular: 'AAA=',
        robotoMonoSemiBold: 'AAA=',
        rubikRegular: 'AAA=',
        rubikSemiBold: 'AAA=',
    }),
    registerPdfFonts: vi.fn(),
}));

describe('generateMultiTransferPdf', () => {
    const mockOnError = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
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
        const transfers = Array.from({ length: 18 }, (_, i) => ({
            amount: { formatted: '0.1', raw: 100000000, unit: 'SOL' },
            receiver: {
                address: `Recv${i.toString().padStart(2, '0')}xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`,
                truncated: `R${i}`,
            },
            sender: {
                address: `Send${i.toString().padStart(2, '0')}xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`,
                truncated: `S${i}`,
            },
        }));
        const multiReceipt: FormattedReceipt = { ...RECEIPT, total: { ...RECEIPT.total, raw: 1800000000 }, transfers };

        const deps = await loadPdfDeps(mockOnError);
        await generateMultiTransferPdf(deps, multiReceipt, PDF_OPTS);

        const allText = collectText();

        for (let i = 0; i < 18; i++) {
            expect(allText).toContain(transfers[i].sender.address);
            expect(allText).toContain(transfers[i].receiver.address);
        }
        expect(allText).not.toContain('largest transfers are shown here');
    });

    it('should cap visible transfers at 16 and render warning bar when there are more than 18', async () => {
        const transfers = Array.from({ length: 20 }, (_, i) => ({
            amount: { formatted: '0.1', raw: 100000000, unit: 'SOL' },
            receiver: {
                address: `Recv${i.toString().padStart(2, '0')}xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`,
                truncated: `R${i}`,
            },
            sender: {
                address: `Send${i.toString().padStart(2, '0')}xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`,
                truncated: `S${i}`,
            },
        }));
        const multiReceipt: FormattedReceipt = { ...RECEIPT, total: { ...RECEIPT.total, raw: 2000000000 }, transfers };

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

    it('should render the Memo label with a dash when memo is absent', async () => {
        const receiptWithoutMemo: FormattedReceipt = { ...RECEIPT, memo: undefined };
        const deps = await loadPdfDeps(mockOnError);

        await generateMultiTransferPdf(deps, receiptWithoutMemo, PDF_OPTS);

        const allText = collectText();

        expect(allText).toContain('Memo');
        expect(allText).not.toContain('Payment for services');
        expect(mockSave).toHaveBeenCalled();
    });

    it('should add editable fields via addField for each AcroForm field', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateMultiTransferPdf(deps, RECEIPT, PDF_OPTS);

        expect(mockAddField).toHaveBeenCalled();
        expect(mockAddField.mock.calls.length).toBeGreaterThan(0);
    });

    it('should render memo cell with label and value when present', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateMultiTransferPdf(deps, RECEIPT, PDF_OPTS);

        const allText = collectText();

        expect(allText).toContain('Memo');
        expect(allText).toContain('Payment for services');
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

    it('should not render any prorated USD per row even when usdValue is provided', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateMultiTransferPdf(deps, RECEIPT, { ...PDF_OPTS, usdValue: '$200.00' });

        const allText = collectText();

        expect(allText).not.toContain('$200.00');
        expect(allText).not.toContain('$');
    });

    it('should not render the Jupiter API attribution on the multi-transfer receipt', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateMultiTransferPdf(deps, RECEIPT, { ...PDF_OPTS, usdValue: '$200.00' });

        const allText = collectText();
        expect(allText).not.toContain('Jupiter API');
    });

    it('should not render the Jupiter API attribution when usdValue is not provided', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateMultiTransferPdf(deps, RECEIPT, PDF_OPTS);

        const allText = collectText();
        expect(allText).not.toContain('Jupiter API');
    });

    it('should not render any USD value when usdValue is not provided', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateMultiTransferPdf(deps, RECEIPT, PDF_OPTS);

        const allText = collectText();

        expect(allText).not.toContain('$');
    });

    it('should handle QR code generation failure gracefully', async () => {
        const qrError = new Error('QR generation failed');
        mockToDataURL.mockRejectedValueOnce(qrError);
        const deps = await loadPdfDeps(mockOnError);

        await generateMultiTransferPdf(deps, RECEIPT, PDF_OPTS);

        expect(mockSave).toHaveBeenCalledWith(`solana-receipt-${SIGNATURE}.pdf`);
        expect(mockOnError).toHaveBeenCalledWith(qrError);
    });

    describe('error paths', () => {
        // svgToDataUrl always opens a Blob URL — making createObjectURL throw
        // is the most surgical way to force the SVG→PNG conversion to fail.
        function breakSvgConversion(): { error: Error; restore: () => void } {
            const error = new Error('Forced SVG conversion failure');
            const target = URL as { createObjectURL?: (b: Blob) => string };
            const original = target.createObjectURL;
            target.createObjectURL = () => {
                throw error;
            };
            return {
                error,
                restore: () => {
                    if (original) target.createObjectURL = original;
                    else delete target.createObjectURL;
                },
            };
        }

        it('should call onError and render the Solana Explorer text fallback when the logo SVG fails', async () => {
            const { error, restore } = breakSvgConversion();
            try {
                const deps = await loadPdfDeps(mockOnError);
                await generateMultiTransferPdf(deps, RECEIPT, PDF_OPTS);

                expect(mockSave).toHaveBeenCalledWith(`solana-receipt-${SIGNATURE}.pdf`);
                expect(mockOnError).toHaveBeenCalledWith(error);
                expect(collectText()).toContain('Solana Explorer');
            } finally {
                restore();
            }
        });

        it('should call onError when the warning-icon SVG fails on a multi-transfer receipt', async () => {
            const transfers = Array.from({ length: 20 }, (_, i) => ({
                amount: { formatted: '0.1', raw: 100000000, unit: 'SOL' },
                receiver: { address: `Recv${i}`.padEnd(43, 'x'), truncated: `R${i}` },
                sender: { address: `Send${i}`.padEnd(43, 'x'), truncated: `S${i}` },
            }));
            const multiReceipt: FormattedReceipt = {
                ...RECEIPT,
                total: { ...RECEIPT.total, raw: 2000000000 },
                transfers,
            };

            const { error, restore } = breakSvgConversion();
            try {
                const deps = await loadPdfDeps(mockOnError);
                await generateMultiTransferPdf(deps, multiReceipt, PDF_OPTS);

                expect(mockSave).toHaveBeenCalled();
                // Warning-icon path + logo path both fail → onError invoked at least twice
                expect(mockOnError.mock.calls.length).toBeGreaterThanOrEqual(2);
                expect(mockOnError).toHaveBeenCalledWith(error);
                // Warning bar text still renders even when its icon failed
                expect(collectText()).toContain('Only the 16 largest transfers are shown here');
            } finally {
                restore();
            }
        });

        it('should save the PDF even when logo, warning icon, and QR code all fail', async () => {
            const transfers = Array.from({ length: 20 }, (_, i) => ({
                amount: { formatted: '0.1', raw: 100000000, unit: 'SOL' },
                receiver: { address: `Recv${i}`.padEnd(43, 'x'), truncated: `R${i}` },
                sender: { address: `Send${i}`.padEnd(43, 'x'), truncated: `S${i}` },
            }));
            const multiReceipt: FormattedReceipt = {
                ...RECEIPT,
                total: { ...RECEIPT.total, raw: 2000000000 },
                transfers,
            };
            const qrError = new Error('QR generation failed');
            mockToDataURL.mockRejectedValue(qrError);

            const { error: svgError, restore } = breakSvgConversion();
            try {
                const deps = await loadPdfDeps(mockOnError);
                await generateMultiTransferPdf(deps, multiReceipt, PDF_OPTS);

                expect(mockSave).toHaveBeenCalledWith(`solana-receipt-${SIGNATURE}.pdf`);
                const reported = mockOnError.mock.calls.map(([e]) => e);
                expect(reported).toContain(svgError);
                expect(reported).toContain(qrError);
            } finally {
                restore();
                mockToDataURL.mockResolvedValue('data:image/png;base64,qrcode');
            }
        });
    });
});
