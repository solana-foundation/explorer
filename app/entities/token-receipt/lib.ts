import { lamportsToSol } from '@utils/index';

import type { FormattedReceipt } from './types';

export function getReceiptMint(receipt: FormattedReceipt): string | undefined {
    return 'mint' in receipt ? receipt.mint : undefined;
}

export function getReceiptSymbol(receipt: FormattedReceipt): string | undefined {
    return receipt.kind === 'token' ? receipt.symbol : undefined;
}

// SOL receipts store total.raw in lamports; token receipts store it as a UI amount.
// Returns the amount in whole units suitable for price math.
export function getReceiptAmount(receipt: FormattedReceipt): number {
    return receipt.kind === 'sol' ? lamportsToSol(receipt.total.raw) : receipt.total.raw;
}
