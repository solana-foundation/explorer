import { writeToString } from 'fast-csv';

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

function sanitizeCsvField(value: string): string {
    return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export function buildReceiptCsvRow(receipt: FormattedReceipt, signature: string, usdValue?: string): string[] {
    const mint = 'mint' in receipt ? receipt.mint : undefined;

    return [
        receipt.date.utc,
        signature,
        receipt.network,
        receipt.sender.address,
        receipt.receiver.address,
        receipt.total.formatted,
        receipt.total.unit,
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
