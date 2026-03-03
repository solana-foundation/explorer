import { vi } from 'vitest';

import type { FormattedReceipt } from '../../types';

const mockTextField = vi.fn(() => ({
    defaultValue: '',
    fieldName: '',
    fontSize: 0,
    height: 0,
    value: '',
    width: 0,
    x: 0,
    y: 0,
}));

const mockSave = vi.fn();
const mockAddField = vi.fn();
const mockText = vi.fn();
const mockAddImage = vi.fn();
const mockSplitTextToSize = vi.fn((text: string, _maxWidth: number) => [text]);

const mockDoc = {
    AcroForm: {
        TextField: mockTextField,
    },
    addField: mockAddField,
    addImage: mockAddImage,
    line: vi.fn(),
    rect: vi.fn(),
    save: mockSave,
    setDrawColor: vi.fn(),
    setFillColor: vi.fn(),
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    setLineWidth: vi.fn(),
    setTextColor: vi.fn(),
    splitTextToSize: mockSplitTextToSize,
    text: mockText,
};

vi.mock('jspdf', () => ({
    jsPDF: vi.fn(() => mockDoc),
}));

const mockToDataURL = vi.fn().mockResolvedValue('data:image/png;base64,qrcode');

vi.mock('qrcode', () => ({
    default: { toDataURL: (...args: unknown[]) => mockToDataURL(...args) },
    toDataURL: (...args: unknown[]) => mockToDataURL(...args),
}));

const RECEIPT: FormattedReceipt = {
    date: { timestamp: 1700000000, utc: '2023-11-14 22:13:20 UTC' },
    fee: { formatted: '0.000005', raw: 5000 },
    memo: 'Payment for services',
    network: 'mainnet-beta',
    receiver: { address: 'ReceiverAddr2222222222222222222222222222222', truncated: 'Recv...2222' },
    sender: { address: 'SenderAddr111111111111111111111111111111111', truncated: 'Send...1111' },
    total: { formatted: '1.0', raw: 1000000000, unit: 'SOL' },
};

const SIGNATURE = '5UfDuX7hXbGjGHqPXRGaHdSecretSignature1234567890abcdef';
const RECEIPT_URL = 'https://explorer.solana.com/receipt/5UfDuX7hXbGjGHqPXRGaHdSecretSignature1234567890abcdef';

describe('generateReceiptPdf', () => {
    let generateReceiptPdf: typeof import('../generate-receipt-pdf').generateReceiptPdf;

    beforeEach(async () => {
        vi.clearAllMocks();
        ({ generateReceiptPdf } = await import('../generate-receipt-pdf'));
    });

    it('should create jsPDF instance with A4 format', async () => {
        const { jsPDF } = await import('jspdf');
        await generateReceiptPdf(RECEIPT, SIGNATURE, RECEIPT_URL);
        expect(jsPDF).toHaveBeenCalledWith({ format: 'a4', unit: 'mm' });
    });

    it('should add pre-filled text for all payment detail fields', async () => {
        await generateReceiptPdf(RECEIPT, SIGNATURE, RECEIPT_URL);

        const textCalls = mockText.mock.calls.map(([text]: [string | string[]]) =>
            Array.isArray(text) ? text.join(' ') : text
        );
        const allText = textCalls.join(' ');

        expect(allText).toContain('Solana Payment Receipt');
        expect(allText).toContain('Solana Blockchain');
        expect(allText).toContain('2023-11-14 22:13:20 UTC');
        expect(allText).toContain('1.0 SOL');
        expect(allText).toContain('SenderAddr111111111111111111111111111111111');
        expect(allText).toContain('ReceiverAddr2222222222222222222222222222222');
        expect(allText).toContain(SIGNATURE);
    });

    it('should create AcroForm text fields for editable sections', async () => {
        await generateReceiptPdf(RECEIPT, SIGNATURE, RECEIPT_URL);

        const fieldNames = mockTextField.mock.results
            .map(r => r.value.fieldName)
            .filter(Boolean);

        expect(fieldNames).toContain('supplier_name');
        expect(fieldNames).toContain('supplier_address');
        expect(fieldNames.some((n: string) => n.startsWith('item_0_'))).toBe(true);
        expect(fieldNames.some((n: string) => n.startsWith('item_3_'))).toBe(true);
    });

    it('should render Total as static text, not an editable field', async () => {
        await generateReceiptPdf(RECEIPT, SIGNATURE, RECEIPT_URL);

        const fieldNames = mockTextField.mock.results
            .map(r => r.value.fieldName)
            .filter(Boolean);
        expect(fieldNames).not.toContain('total');

        const textCalls = mockText.mock.calls.map(([text]: [string | string[]]) =>
            Array.isArray(text) ? text.join(' ') : text
        );
        const allText = textCalls.join(' ');
        expect(allText).toContain('1.0 SOL');
    });

    it('should call doc.save with full signature filename', async () => {
        await generateReceiptPdf(RECEIPT, SIGNATURE, RECEIPT_URL);

        expect(mockSave).toHaveBeenCalledWith(`solana-receipt-${SIGNATURE}.pdf`);
    });

    it('should handle missing memo gracefully', async () => {
        const receiptWithoutMemo: FormattedReceipt = { ...RECEIPT, memo: undefined };

        await generateReceiptPdf(receiptWithoutMemo, SIGNATURE, RECEIPT_URL);

        const textCalls = mockText.mock.calls.map(([text]: [string | string[]]) =>
            Array.isArray(text) ? text.join(' ') : text
        );
        const allText = textCalls.join(' ');

        expect(allText).not.toContain('Transaction Memo');
        expect(mockSave).toHaveBeenCalled();
    });

    it('should add editable fields via addField for each AcroForm field', async () => {
        await generateReceiptPdf(RECEIPT, SIGNATURE, RECEIPT_URL);

        expect(mockAddField).toHaveBeenCalled();
        expect(mockAddField.mock.calls.length).toBeGreaterThan(0);
    });

    it('should include memo in text when present', async () => {
        await generateReceiptPdf(RECEIPT, SIGNATURE, RECEIPT_URL);

        const textCalls = mockText.mock.calls.map(([text]: [string | string[]]) =>
            Array.isArray(text) ? text.join(' ') : text
        );
        const allText = textCalls.join(' ');

        expect(allText).toContain('Transaction Memo');
        expect(allText).toContain('Payment for services');
    });

    it('should embed QR code image in the PDF', async () => {
        await generateReceiptPdf(RECEIPT, SIGNATURE, RECEIPT_URL);

        expect(mockToDataURL).toHaveBeenCalledWith(RECEIPT_URL, { width: 200, margin: 0 });

        const addImageCalls = mockAddImage.mock.calls;
        const qrCall = addImageCalls.find(
            ([dataUrl]: [string]) => dataUrl === 'data:image/png;base64,qrcode'
        );
        expect(qrCall).toBeDefined();

        const textCalls = mockText.mock.calls.map(([text]: [string | string[]]) =>
            Array.isArray(text) ? text.join(' ') : text
        );
        const allText = textCalls.join(' ');
        expect(allText).toContain('Verify on Solana Explorer');
    });

    it('should handle QR code generation failure gracefully', async () => {
        mockToDataURL.mockRejectedValueOnce(new Error('QR generation failed'));

        await generateReceiptPdf(RECEIPT, SIGNATURE, RECEIPT_URL);

        expect(mockSave).toHaveBeenCalledWith(`solana-receipt-${SIGNATURE}.pdf`);
    });
});
