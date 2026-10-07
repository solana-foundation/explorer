import { vi } from 'vitest';

import { generateMultiTransferPdf } from '../generate-multi-transfer-pdf';
import { generateReceiptPdf, loadPdfDeps } from '../generate-receipt-pdf';
import { generateSingleTransferPdf } from '../generate-single-transfer-pdf';
import {
    buildMultiSolReceipt,
    collectTextFromMock as collectText,
    mockJsPDF,
    mockSave,
    mockToDataURL,
    PDF_OPTS,
    qrcodeModule,
    SIGNATURE,
    SOL_RECEIPT,
    stubSvgRasterizationUnsupported,
} from './__fixtures__/pdf-mocks';

vi.mock('jspdf', () => ({ jsPDF: mockJsPDF }));
vi.mock('qrcode', () => qrcodeModule);
vi.mock('../pdf-fonts', async () => (await import('./__fixtures__/pdf-mocks')).pdfFontsModule);

describe('generateReceiptPdf (dispatcher)', () => {
    const mockOnError = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        stubSvgRasterizationUnsupported();
    });

    it('should route a single-transfer receipt to the single-transfer renderer', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateReceiptPdf(deps, SOL_RECEIPT, PDF_OPTS);

        const allText = collectText();
        // Both layouts use "Transaction details"; single is identified by the
        // absence of the "Transfers" section title.
        expect(allText).toContain('Transaction details');
        expect(allText).toContain('Amount');
        expect(allText).not.toContain('Transfers');
    });

    it('should route a multi-transfer receipt to the multi-transfer renderer', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateReceiptPdf(deps, buildMultiSolReceipt(3), PDF_OPTS);

        const allText = collectText();
        expect(allText).toContain('Transaction details');
        expect(allText).toContain('Transfers');
        expect(allText).toContain('Sender');
        expect(allText).toContain('Receiver');
        expect(allText).toContain('Amount');
    });

    it('should route a receipt with exactly one transfer entry to the single renderer', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateReceiptPdf(deps, buildMultiSolReceipt(1), PDF_OPTS);

        const allText = collectText();
        expect(allText).toContain('Transaction details');
        expect(allText).not.toContain('Transfers');
    });
});

describe.each([
    ['generateSingleTransferPdf', generateSingleTransferPdf],
    ['generateMultiTransferPdf', generateMultiTransferPdf],
])('%s', (_, generatePdf) => {
    const mockOnError = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        stubSvgRasterizationUnsupported();
    });

    it('should still save the PDF and report a wrapped error when QR generation fails', async () => {
        const qrError = new Error('QR generation failed');
        mockToDataURL.mockRejectedValueOnce(qrError);

        const deps = await loadPdfDeps(mockOnError);
        await generatePdf(deps, SOL_RECEIPT, PDF_OPTS);

        expect(mockSave).toHaveBeenCalledWith(`solana-receipt-${SIGNATURE}.pdf`);
        const reported = mockOnError.mock.calls.map(([e]) => e as Error);
        const qrReport = reported.find(e => e.message === 'Failed to render QR code in receipt footer');
        expect(qrReport).toBeDefined();
        expect(qrReport?.cause).toBe(qrError);
    });
});
