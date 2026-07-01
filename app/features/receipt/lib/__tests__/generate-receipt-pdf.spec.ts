import { vi } from 'vitest';

import { generateReceiptPdf, loadPdfDeps } from '../generate-receipt-pdf';
import {
    buildMultiSolReceipt,
    collectTextFromMock as collectText,
    mockJsPDF,
    mockToDataURL,
    PDF_OPTS,
    SOL_RECEIPT,
    stubSvgRasterizationUnsupported,
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

    it('should append the cluster label to the subtitle when provided', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateReceiptPdf(deps, SOL_RECEIPT, { ...PDF_OPTS, clusterLabel: 'Custom-Cluster' });

        expect(collectText()).toContain('On-chain Transaction Record — Custom-Cluster');
    });

    it('should always render Memo and Amount USD labels even when values are missing', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateReceiptPdf(deps, { ...SOL_RECEIPT, memo: undefined }, PDF_OPTS);

        const allText = collectText();
        expect(allText).toContain('Memo');
        expect(allText).toContain('Amount USD - equivalent by Jupiter API');
        // No usdValue → no Jupiter "report date" caption should appear
        expect(allText).not.toContain('Equivalent on report date');
    });
});
