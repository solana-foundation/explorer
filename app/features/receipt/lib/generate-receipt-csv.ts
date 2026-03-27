import { writeToString } from '@fast-csv/format';

import type { FormattedReceipt } from '../types';

const CSV_HEADERS = [
    'Date (UTC)',
    'Signature',
    'Network',
    'Sender',
    'Receiver',
    'Amount',
    'Token',
    'Mint',
    'Amount (USD)',
    'Fee (SOL)',
    'Memo',
] as const;

// Prevents CSV formula injection by prefixing dangerous leading characters with a single quote.
// fast-csv handles CSV formatting (quoting, delimiter escaping) but not application-level injection.
// Sanitize any field sourced from user-controlled or on-chain data (memo, token symbol).
function sanitizeCsvField(value: string): string {
    // eslint-disable-next-line no-restricted-syntax -- regex is the clearest way to express CSV formula injection chars
    return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export function buildReceiptCsvRow(receipt: FormattedReceipt, signature: string, usdValue?: string): string[] {
    const mint = receipt.kind === 'token' ? receipt.mint : undefined;

    return [
        receipt.date.utc,
        signature,
        receipt.network,
        receipt.sender.address,
        receipt.receiver.address,
        receipt.total.formatted,
        sanitizeCsvField(receipt.total.unit), // token symbol comes from on-chain metadata
        mint ?? '',
        usdValue ?? '',
        receipt.fee.formatted,
        sanitizeCsvField(receipt.memo ?? ''),
    ];
}

export async function generateReceiptCsv(
    receipt: FormattedReceipt,
    signature: string,
    usdValue?: string,
): Promise<void> {
    const row = buildReceiptCsvRow(receipt, signature, usdValue);
    const csv = await writeToString([row], { headers: [...CSV_HEADERS] });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `solana-receipt-${signature}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
