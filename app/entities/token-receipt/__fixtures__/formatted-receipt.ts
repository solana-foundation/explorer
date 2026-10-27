import type { FormattedReceipt, FormattedReceiptToken } from '../types';

export function buildFormattedReceipt(overrides: Partial<FormattedReceipt> = {}): FormattedReceipt {
    return {
        date: { timestamp: 1700000000, utc: '2023-11-14 22:13:20 UTC' },
        fee: { formatted: '0.000005', raw: 5000 },
        kind: 'sol',
        memo: 'Payment for services',
        network: 'mainnet-beta',
        receiver: { address: 'ReceiverAddr2222222222222222222222222222222', truncated: 'Recv...2222' },
        sender: { address: 'SenderAddr111111111111111111111111111111111', truncated: 'Send...1111' },
        total: { formatted: '1.0', raw: 1000000000, unit: 'SOL' },
        ...overrides,
    };
}

export function buildFormattedTokenReceipt(overrides: Partial<FormattedReceiptToken> = {}): FormattedReceiptToken {
    return {
        ...buildFormattedReceipt(),
        kind: 'token',
        mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
        symbol: 'USDC',
        total: { formatted: '143.25', raw: 143.25, unit: 'USDC' },
        ...overrides,
    };
}
