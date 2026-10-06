import type { FormattedReceipt } from '../types';

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
