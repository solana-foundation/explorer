import { vi } from 'vitest';

import type { FormattedReceipt } from '../../../types';

export const mockTextField = vi.fn(function () {
    return {
        defaultValue: '',
        fieldName: '',
        fontSize: 0,
        height: 0,
        value: '',
        width: 0,
        x: 0,
        y: 0,
    };
});
export const mockSave = vi.fn();
export const mockAddField = vi.fn();
export const mockText = vi.fn();
export const mockAddImage = vi.fn();
export const mockDoc = {
    AcroForm: { TextField: mockTextField },
    addField: mockAddField,
    addFileToVFS: vi.fn(),
    addFont: vi.fn(),
    addImage: mockAddImage,
    addPage: vi.fn(),
    getTextWidth: vi.fn().mockReturnValue(0),
    line: vi.fn(),
    link: vi.fn(),
    rect: vi.fn(),
    roundedRect: vi.fn(),
    save: mockSave,
    setDrawColor: vi.fn(),
    setFillColor: vi.fn(),
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    setLineWidth: vi.fn(),
    setTextColor: vi.fn(),
    splitTextToSize: vi.fn((text: string, _maxWidth: number) => [text]),
    text: mockText,
};
export const mockJsPDF = vi.fn(function () {
    return mockDoc;
});
export const mockToDataURL = vi.fn().mockResolvedValue('data:image/png;base64,qrcode');

// jsdom cannot rasterize SVGs, and Vitest 4's jsdom environment now returns a working
// URL.createObjectURL (it threw in Vitest 3). Without this, svgToDataUrl would await an
// Image.onload that never fires under jsdom and the test would hang. Force createObjectURL
// to throw so the PDF renderers take their graceful SVG-conversion-failure fallback.
export function stubSvgRasterizationUnsupported(): void {
    // Restore any prior createObjectURL spy before re-spying so layers don't stack.
    vi.restoreAllMocks();
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
        throw new Error('createObjectURL is not supported in the test environment');
    });
}

export const SIGNATURE = '5UfDuX7hXbGjGHqPXRGaHdSecretSignature1234567890abcdef';
export const RECEIPT_URL = 'https://explorer.solana.com/receipt/5UfDuX7hXbGjGHqPXRGaHdSecretSignature1234567890abcdef';
export const CLUSTER_LABEL = 'Mainnet Beta';

export const PDF_OPTS = { clusterLabel: CLUSTER_LABEL, receiptUrl: RECEIPT_URL, signature: SIGNATURE } as const;

export const SOL_RECEIPT: FormattedReceipt = {
    date: { timestamp: 1700000000, utc: '2023-11-14 22:13:20 UTC' },
    fee: { formatted: '0.000005', raw: 5000 },
    kind: 'sol',
    memo: 'Payment for services',
    network: 'Mainnet',
    receiver: { address: 'ReceiverAddr2222222222222222222222222222222', truncated: 'Recv...2222' },
    sender: { address: 'SenderAddr111111111111111111111111111111111', truncated: 'Send...1111' },
    total: { formatted: '1.0', raw: 1000000000, unit: 'SOL' },
};

export const USDC_RECEIPT: FormattedReceipt = {
    date: { timestamp: 1700000000, utc: '2023-11-14 22:13:20 UTC' },
    fee: { formatted: '0.000005', raw: 5000 },
    kind: 'token',
    memo: undefined,
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    network: 'Mainnet',
    receiver: { address: 'ReceiverAddr2222222222222222222222222222222', truncated: 'Recv...2222' },
    sender: { address: 'SenderAddr111111111111111111111111111111111', truncated: 'Send...1111' },
    symbol: 'USDC',
    total: { formatted: '125.50', raw: 125.5, unit: 'USDC' },
};

export function buildMultiSolReceipt(count: number, perTransferRaw = 100_000_000): FormattedReceipt {
    const transfers = Array.from({ length: count }, (_, i) => ({
        amount: { formatted: '0.1', raw: perTransferRaw, unit: 'SOL' },
        receiver: {
            address: `Recv${i.toString().padStart(2, '0')}xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`,
            truncated: `R${i}`,
        },
        sender: {
            address: `Send${i.toString().padStart(2, '0')}xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`,
            truncated: `S${i}`,
        },
    }));
    return { ...SOL_RECEIPT, total: { ...SOL_RECEIPT.total, raw: perTransferRaw * count }, transfers };
}

export function collectTextFromMock(): string {
    return mockText.mock.calls.map(([text]) => (Array.isArray(text) ? text.join(' ') : text)).join(' ');
}
