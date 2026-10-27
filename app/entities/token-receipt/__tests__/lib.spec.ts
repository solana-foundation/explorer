import { describe, expect, it } from 'vitest';

import { buildFormattedReceipt, buildFormattedTokenReceipt } from '../__fixtures__/formatted-receipt';
import { getReceiptAmount, getReceiptMint, getReceiptSymbol } from '../lib';

const SOL_RECEIPT = buildFormattedReceipt({ total: { formatted: '1.5', raw: 1_500_000_000, unit: 'SOL' } });

const TOKEN_RECEIPT = buildFormattedTokenReceipt();

describe('getReceiptMint', () => {
    it('should return undefined for SOL receipts', () => {
        expect(getReceiptMint(SOL_RECEIPT)).toBeUndefined();
    });

    it('should return mint address for token receipts', () => {
        expect(getReceiptMint(TOKEN_RECEIPT)).toBe('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
    });

    it('should return undefined for token receipts without mint', () => {
        const receipt = buildFormattedTokenReceipt({ mint: undefined });
        expect(getReceiptMint(receipt)).toBeUndefined();
    });
});

describe('getReceiptSymbol', () => {
    it('should return undefined for SOL receipts', () => {
        expect(getReceiptSymbol(SOL_RECEIPT)).toBeUndefined();
    });

    it('should return symbol for token receipts', () => {
        expect(getReceiptSymbol(TOKEN_RECEIPT)).toBe('USDC');
    });

    it('should return undefined for token receipts without symbol', () => {
        const receipt = buildFormattedTokenReceipt({ symbol: undefined });
        expect(getReceiptSymbol(receipt)).toBeUndefined();
    });
});

describe('getReceiptAmount', () => {
    it('should convert lamports to SOL for SOL receipts', () => {
        expect(getReceiptAmount(SOL_RECEIPT)).toBe(1.5);
    });

    it('should return raw amount for token receipts', () => {
        expect(getReceiptAmount(TOKEN_RECEIPT)).toBe(143.25);
    });
});
