import { describe, expect, it } from 'vitest';

import type { FormattedReceipt } from '../types';

import { getReceiptAmount, getReceiptMint, getReceiptSymbol } from '../lib';

const SOL_RECEIPT: FormattedReceipt = {
    date: { timestamp: 1700000000, utc: '2023-11-14 22:13:20 UTC' },
    fee: { formatted: '0.000005', raw: 5000 },
    kind: 'sol',
    memo: undefined,
    network: 'mainnet-beta',
    receiver: { address: 'Recv2222', truncated: 'Recv...22' },
    sender: { address: 'Send1111', truncated: 'Send...11' },
    total: { formatted: '1.5', raw: 1_500_000_000, unit: 'SOL' },
};

const TOKEN_RECEIPT: FormattedReceipt = {
    date: { timestamp: 1700000000, utc: '2023-11-14 22:13:20 UTC' },
    fee: { formatted: '0.000005', raw: 5000 },
    kind: 'token',
    memo: undefined,
    mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    network: 'mainnet-beta',
    receiver: { address: 'Recv2222', truncated: 'Recv...22' },
    sender: { address: 'Send1111', truncated: 'Send...11' },
    symbol: 'USDC',
    total: { formatted: '143.25', raw: 143.25, unit: 'USDC' },
};

describe('getReceiptMint', () => {
    it('should return undefined for SOL receipts', () => {
        expect(getReceiptMint(SOL_RECEIPT)).toBeUndefined();
    });

    it('should return mint address for token receipts', () => {
        expect(getReceiptMint(TOKEN_RECEIPT)).toBe('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
    });

    it('should return undefined for token receipts without mint', () => {
        const receipt: FormattedReceipt = { ...TOKEN_RECEIPT, mint: undefined };
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
        const receipt: FormattedReceipt = { ...TOKEN_RECEIPT, symbol: undefined };
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
