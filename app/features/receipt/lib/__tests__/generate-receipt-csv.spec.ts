import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { FormattedReceipt } from '../../types';
import { buildReceiptCsvRow, generateReceiptCsv } from '../generate-receipt-csv';

const RECEIPT: FormattedReceipt = {
    date: { timestamp: 1700000000, utc: '2023-11-14 22:13:20 UTC' },
    fee: { formatted: '0.000005', raw: 5000 },
    kind: 'sol',
    memo: 'Payment for services',
    network: 'mainnet-beta',
    receiver: { address: 'ReceiverAddr2222222222222222222222222222222', truncated: 'Recv...2222' },
    sender: { address: 'SenderAddr111111111111111111111111111111111', truncated: 'Send...1111' },
    total: { formatted: '1.0', raw: 1000000000, unit: 'SOL' },
};

const SIGNATURE = '5UfDuX7hXbGjGHqPXRGaHdSecretSignature1234567890abcdef';

describe('buildReceiptCsvRow', () => {
    it('should include all expected fields in correct column order', () => {
        const row = buildReceiptCsvRow(RECEIPT, SIGNATURE);

        expect(row[0]).toBe('2023-11-14 22:13:20 UTC');
        expect(row[1]).toBe(SIGNATURE);
        expect(row[2]).toBe('mainnet-beta');
        expect(row[3]).toBe('SenderAddr111111111111111111111111111111111');
        expect(row[4]).toBe('ReceiverAddr2222222222222222222222222222222');
        expect(row[5]).toBe('1.0');
        expect(row[6]).toBe('SOL');
        expect(row[7]).toBe('');
        expect(row[8]).toBe('');
        expect(row[9]).toBe('0.000005');
        expect(row[10]).toBe('Payment for services');
        expect(row).toHaveLength(11);
    });

    it('should include USD value when provided', () => {
        const row = buildReceiptCsvRow(RECEIPT, SIGNATURE, '$150.00');
        expect(row[8]).toBe('$150.00');
    });

    it('should leave mint field empty for SOL receipts', () => {
        const row = buildReceiptCsvRow(RECEIPT, SIGNATURE);
        expect(row[7]).toBe('');
    });

    it('should include mint address for token receipts', () => {
        const tokenReceipt: FormattedReceipt = {
            ...RECEIPT,
            kind: 'token',
            mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
            symbol: 'USDC',
            total: { formatted: '143.25', raw: 143.25, unit: 'USDC' },
        };
        const row = buildReceiptCsvRow(tokenReceipt, SIGNATURE);
        expect(row[6]).toBe('USDC');
        expect(row[7]).toBe('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
    });

    it('should leave memo field empty when absent', () => {
        const receiptNoMemo: FormattedReceipt = { ...RECEIPT, memo: undefined };
        const row = buildReceiptCsvRow(receiptNoMemo, SIGNATURE);
        expect(row[10]).toBe('');
    });

    it('should sanitize memo with formula-injection prefix', () => {
        const receipt: FormattedReceipt = { ...RECEIPT, memo: '=SUM(A1)' };
        const row = buildReceiptCsvRow(receipt, SIGNATURE);
        expect(row[10]).toBe("'=SUM(A1)");
    });

    it('should sanitize token symbol with formula-injection prefix', () => {
        const receipt: FormattedReceipt = {
            ...RECEIPT,
            kind: 'token',
            mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
            symbol: '=EVIL',
            total: { formatted: '100', raw: 100, unit: '=EVIL' },
        };
        const row = buildReceiptCsvRow(receipt, SIGNATURE);
        expect(row[6]).toBe("'=EVIL");
    });
});

describe('generateReceiptCsv', () => {
    let mockClick: ReturnType<typeof vi.fn>;
    let linkElement: Record<string, unknown>;

    beforeEach(() => {
        mockClick = vi.fn();
        linkElement = { click: mockClick, download: '', href: '' };
        vi.spyOn(document, 'createElement').mockReturnValue(linkElement as unknown as HTMLElement);
        vi.spyOn(document.body, 'appendChild').mockReturnValue(linkElement as unknown as ChildNode);
        vi.spyOn(document.body, 'removeChild').mockReturnValue(linkElement as unknown as ChildNode);
        vi.stubGlobal('URL', {
            createObjectURL: vi.fn().mockReturnValue('blob:test-url'),
            revokeObjectURL: vi.fn(),
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('should set the correct download filename', async () => {
        await generateReceiptCsv(RECEIPT, SIGNATURE);
        expect(linkElement.download).toBe(`solana-receipt-${SIGNATURE}.csv`);
    });

    it('should set the href to the object URL', async () => {
        await generateReceiptCsv(RECEIPT, SIGNATURE);
        expect(linkElement.href).toBe('blob:test-url');
    });

    it('should revoke the object URL after triggering download', async () => {
        await generateReceiptCsv(RECEIPT, SIGNATURE);
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    });

    it('should pass a Blob with CSV mime type to createObjectURL', async () => {
        await generateReceiptCsv(RECEIPT, SIGNATURE);

        const blobArg = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0] as Blob;
        expect(blobArg).toBeInstanceOf(Blob);
        expect(blobArg.type).toBe('text/csv;charset=utf-8;');
    });

    it('should pass a non-empty Blob to createObjectURL', async () => {
        await generateReceiptCsv(RECEIPT, SIGNATURE);

        const blobArg = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0] as Blob;
        expect(blobArg.size).toBeGreaterThan(0);
    });
});
