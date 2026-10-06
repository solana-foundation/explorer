import { vi } from 'vitest';

import { loadPdfDeps } from '../generate-receipt-pdf';
import { generateSingleTransferPdf } from '../generate-single-transfer-pdf';
import {
    collectTextFromMock as collectText,
    mockJsPDF,
    mockSave,
    PDF_OPTS,
    qrcodeModule,
    SIGNATURE,
    SOL_RECEIPT,
    stubSvgRasterizationUnsupported,
    USDC_RECEIPT,
} from './__fixtures__/pdf-mocks';

vi.mock('jspdf', () => ({ jsPDF: mockJsPDF }));
vi.mock('qrcode', () => qrcodeModule);
vi.mock('../pdf-fonts', async () => (await import('./__fixtures__/pdf-mocks')).pdfFontsModule);

describe('generateSingleTransferPdf', () => {
    const mockOnError = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        stubSvgRasterizationUnsupported();
    });

    it('should render the Solana Payment Receipt title and Transaction details section', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateSingleTransferPdf(deps, SOL_RECEIPT, PDF_OPTS);

        const allText = collectText();
        expect(allText).toContain('Solana Payment Receipt');
        expect(allText).toContain('On-chain Transaction Record');
        expect(allText).toContain('Transaction details');
    });

    it('should append the cluster label to the subtitle when provided', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateSingleTransferPdf(deps, SOL_RECEIPT, { ...PDF_OPTS, clusterLabel: 'Custom-Cluster' });

        expect(collectText()).toContain('On-chain Transaction Record — Custom-Cluster');
    });

    it('should render the payment date, network fee, sender, receiver, signature, and memo labels', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateSingleTransferPdf(deps, SOL_RECEIPT, PDF_OPTS);

        const allText = collectText();
        expect(allText).toContain('Payment date');
        expect(allText).toContain('Network fee');
        expect(allText).toContain('Sender');
        expect(allText).toContain('Receiver');
        expect(allText).toContain('Signature');
        expect(allText).toContain('Memo');
    });

    it('should render the amount with the receipt unit for a SOL receipt', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateSingleTransferPdf(deps, SOL_RECEIPT, PDF_OPTS);

        const allText = collectText();
        expect(allText).toContain(`${SOL_RECEIPT.total.formatted} ${SOL_RECEIPT.total.unit}`);
    });

    it('should render the amount with the token symbol for a token receipt', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateSingleTransferPdf(deps, USDC_RECEIPT, PDF_OPTS);

        const allText = collectText();
        expect(allText).toContain('125.50 USDC');
    });

    it('should render the network fee in SOL even when the receipt is a token', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateSingleTransferPdf(deps, USDC_RECEIPT, PDF_OPTS);

        const allText = collectText();
        expect(allText).toContain(`${USDC_RECEIPT.fee.formatted} SOL`);
    });

    it('should render sender, receiver, and signature values', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateSingleTransferPdf(deps, SOL_RECEIPT, PDF_OPTS);

        const allText = collectText();
        expect(allText).toContain(SOL_RECEIPT.sender.address);
        expect(allText).toContain(SOL_RECEIPT.receiver.address);
        expect(allText).toContain(SIGNATURE);
    });

    it('should render the memo value when present', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateSingleTransferPdf(deps, SOL_RECEIPT, PDF_OPTS);

        const allText = collectText();
        expect(allText).toContain(SOL_RECEIPT.memo as string);
    });

    it('should render the Jupiter API caption and USD value when usdValue is provided', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateSingleTransferPdf(deps, SOL_RECEIPT, { ...PDF_OPTS, usdValue: '~2.36 USD' });

        const allText = collectText();
        expect(allText).toContain('Amount USD - equivalent by Jupiter API');
        expect(allText).toContain('~2.36 USD');
        expect(allText).toContain('Equivalent on report date');
        expect(allText).toContain('not transaction date');
    });

    it('should always render the Memo and Amount USD labels and show an en-dash when usdValue is undefined', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateSingleTransferPdf(deps, { ...SOL_RECEIPT, memo: undefined }, PDF_OPTS);

        const allText = collectText();
        expect(allText).toContain('Memo');
        expect(allText).toContain('Amount USD - equivalent by Jupiter API');
        expect(allText).toContain('–');
        expect(allText).not.toContain('Equivalent on report date');
    });

    it('should render usdUnavailableNote as a caption when usdValue is undefined', async () => {
        const deps = await loadPdfDeps(mockOnError);
        const note = 'USD conversion is only available on Mainnet Beta';
        await generateSingleTransferPdf(deps, SOL_RECEIPT, { ...PDF_OPTS, usdUnavailableNote: note });

        const allText = collectText();
        expect(allText).toContain('–');
        expect(allText).toContain(note);
        expect(allText).not.toContain('Equivalent on report date');
    });

    it('should ignore usdUnavailableNote when usdValue is provided', async () => {
        const deps = await loadPdfDeps(mockOnError);
        const note = 'USD conversion is only available on Mainnet Beta';
        await generateSingleTransferPdf(deps, SOL_RECEIPT, {
            ...PDF_OPTS,
            usdUnavailableNote: note,
            usdValue: '~2.36 USD',
        });

        const allText = collectText();
        expect(allText).toContain('~2.36 USD');
        expect(allText).not.toContain(note);
        expect(allText).toContain('Equivalent on report date');
    });

    it('should call doc.save with the full signature filename', async () => {
        const deps = await loadPdfDeps(mockOnError);
        await generateSingleTransferPdf(deps, SOL_RECEIPT, PDF_OPTS);

        expect(mockSave).toHaveBeenCalledWith(`solana-receipt-${SIGNATURE}.pdf`);
    });
});
