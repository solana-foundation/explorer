import { vi } from 'vitest';

import { generateReceiptPdf, loadPdfDeps } from '../generate-receipt-pdf';
import {
    buildMultiSolReceipt,
    collectTextFromMock as collectText,
    mockJsPDF,
    mockToDataURL,
    RECEIPT_URL,
    SIGNATURE,
    SOL_RECEIPT,
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
    });

    it('should route a single-transfer receipt to the single-transfer renderer', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateReceiptPdf(deps, SOL_RECEIPT, SIGNATURE, RECEIPT_URL);

        const allText = collectText();
        // Single layout uses "Payment Details" + uppercase "PAYMENT METHOD" labels
        expect(allText).toContain('Payment Details');
        expect(allText).toContain('PAYMENT METHOD');
        expect(allText).not.toContain('Transfers');
    });

    it('should route a multi-transfer receipt to the multi-transfer renderer', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateReceiptPdf(deps, buildMultiSolReceipt(3), SIGNATURE, RECEIPT_URL);

        const allText = collectText();
        // Multi layout uses "Transaction details" + "Transfers" + table headers
        expect(allText).toContain('Transaction details');
        expect(allText).toContain('Transfers');
        expect(allText).toContain('Sender');
        expect(allText).toContain('Receiver');
        expect(allText).toContain('Amount');
        expect(allText).not.toContain('Payment Details');
    });

    it('should route a receipt with exactly one transfer entry to the single renderer', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateReceiptPdf(deps, buildMultiSolReceipt(1), SIGNATURE, RECEIPT_URL);

        const allText = collectText();
        expect(allText).toContain('Payment Details');
        expect(allText).not.toContain('Transfers');
    });
});
