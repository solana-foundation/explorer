import { vi } from 'vitest';

import { generateSingleTransferPdf } from '../generate-single-transfer-pdf';
import { loadPdfDeps } from '../generate-receipt-pdf';
import {
    collectTextFromMock as collectText,
    mockJsPDF,
    mockSave,
    mockToDataURL,
    RECEIPT_URL,
    SIGNATURE,
    SOL_RECEIPT,
    USDC_RECEIPT,
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

describe('generateSingleTransferPdf', () => {
    const mockOnError = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the Solana Payment Receipt title and Payment Details section', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateSingleTransferPdf(deps, SOL_RECEIPT, SIGNATURE, RECEIPT_URL);

        const allText = collectText();
        expect(allText).toContain('Solana Payment Receipt');
        expect(allText).toContain('On-chain Transaction Record');
        expect(allText).toContain('Payment Details');
    });

    it('should render "Solana (SOL)" as Payment Method for a SOL receipt', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateSingleTransferPdf(deps, SOL_RECEIPT, SIGNATURE, RECEIPT_URL);

        const allText = collectText();
        expect(allText).toContain('PAYMENT METHOD');
        expect(allText).toContain('Solana (SOL)');
    });

    it('should render "Solana (USDC)" as Payment Method for a USDC (Token-2022 compatible) receipt', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateSingleTransferPdf(deps, USDC_RECEIPT, SIGNATURE, RECEIPT_URL);

        const allText = collectText();
        expect(allText).toContain('Solana (USDC)');
    });

    it('should render the amount with the receipt unit for a SOL receipt', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateSingleTransferPdf(deps, SOL_RECEIPT, SIGNATURE, RECEIPT_URL);

        const allText = collectText();
        expect(allText).toContain(`${SOL_RECEIPT.total.formatted} ${SOL_RECEIPT.total.unit}`);
    });

    it('should render the amount with the token symbol for a token receipt', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateSingleTransferPdf(deps, USDC_RECEIPT, SIGNATURE, RECEIPT_URL);

        const allText = collectText();
        expect(allText).toContain('125.50 USDC');
    });

    it('should render the network fee in SOL even when the receipt is a token', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateSingleTransferPdf(deps, USDC_RECEIPT, SIGNATURE, RECEIPT_URL);

        const allText = collectText();
        expect(allText).toContain('NETWORK FEE');
        expect(allText).toContain(`${USDC_RECEIPT.fee.formatted} SOL`);
    });

    it('should render sender, receiver, and signature stacked rows', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateSingleTransferPdf(deps, SOL_RECEIPT, SIGNATURE, RECEIPT_URL);

        const allText = collectText();
        expect(allText).toContain('SENDER WALLET ADDRESS');
        expect(allText).toContain(SOL_RECEIPT.sender.address);
        expect(allText).toContain('RECEIVER WALLET ADDRESS');
        expect(allText).toContain(SOL_RECEIPT.receiver.address);
        expect(allText).toContain('TRANSACTION SIGNATURE');
        expect(allText).toContain(SIGNATURE);
    });

    it('should render Transaction Memo when memo is present', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateSingleTransferPdf(deps, SOL_RECEIPT, SIGNATURE, RECEIPT_URL);

        const allText = collectText();
        expect(allText).toContain('TRANSACTION MEMO');
        expect(allText).toContain(SOL_RECEIPT.memo!);
    });

    it('should render the Jupiter API attribution when usdValue is provided', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateSingleTransferPdf(deps, SOL_RECEIPT, SIGNATURE, RECEIPT_URL, undefined, '$2.36');

        const allText = collectText();
        expect(allText).toContain('AMOUNT (USD)');
        expect(allText).toContain('$2.36');
        expect(allText).toContain('Estimated current value at time of download provided by Jupiter API');
    });

    it('should not render the Jupiter API attribution when usdValue is undefined', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateSingleTransferPdf(deps, SOL_RECEIPT, SIGNATURE, RECEIPT_URL);

        const allText = collectText();
        expect(allText).not.toContain('Jupiter API');
        expect(allText).not.toContain('AMOUNT (USD)');
    });

    it('should call doc.save with the full signature filename', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateSingleTransferPdf(deps, SOL_RECEIPT, SIGNATURE, RECEIPT_URL);

        expect(mockSave).toHaveBeenCalledWith(`solana-receipt-${SIGNATURE}.pdf`);
    });

    it('should save the PDF when the QR code generation fails', async () => {
        const qrError = new Error('QR generation failed');
        mockToDataURL.mockRejectedValueOnce(qrError);

        const deps = await loadPdfDeps(mockOnError);
        await generateSingleTransferPdf(deps, SOL_RECEIPT, SIGNATURE, RECEIPT_URL);

        expect(mockSave).toHaveBeenCalledWith(`solana-receipt-${SIGNATURE}.pdf`);
        expect(mockOnError).toHaveBeenCalledWith(qrError);
    });
});
