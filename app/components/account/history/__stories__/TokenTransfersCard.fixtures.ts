import { gen } from '@__fixtures__/gen';

import type { TokenTransferRowView } from '../BaseTokenTransfersCard';

// Seeded so story snapshots stay pixel-stable.
export function transferRow(seed: number, overrides: Partial<TokenTransferRowView> = {}): TokenTransferRowView {
    return {
        amount: '1,250.000000',
        blockTime: 1_718_000_000 + seed * 60,
        destination: gen.publicKey(seed * 2 + 1),
        key: `transfer-${seed}`,
        rawAmount: '1,250.000000',
        scaledUiAmountMultiplier: { multiplier: '1', status: 'known' },
        signature: gen.signature(seed),
        source: gen.publicKey(seed * 2),
        status: 'success',
        units: 'USDC',
        ...overrides,
    };
}

export const TRANSFER_ROWS: TokenTransferRowView[] = [
    transferRow(1),
    transferRow(2, { amount: '0.010000', rawAmount: '0.010000', status: 'failed' }),
    transferRow(3, { blockTime: undefined }),
    transferRow(4, { amount: '98,765,432.123456', rawAmount: '98,765,432.123456' }),
];
