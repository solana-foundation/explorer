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

function needsQuoting(value: string): boolean {
    // eslint-disable-next-line no-restricted-syntax -- regex is needed to detect CSV special characters
    return /[",\n\r]/.test(value);
}

function csvEscape(value: string | undefined): string {
    if (!value) return '';
    if (needsQuoting(value)) {
        // eslint-disable-next-line no-restricted-syntax -- regex is needed to escape double quotes per RFC 4180
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

export function buildReceiptCsvRow(receipt: FormattedReceipt, signature: string, usdValue?: string): string {
    const mint = 'mint' in receipt ? receipt.mint : undefined;

    const fields: (string | undefined)[] = [
        receipt.date.utc,
        signature,
        receipt.network,
        receipt.sender.address,
        receipt.receiver.address,
        receipt.total.formatted,
        receipt.total.unit,
        mint,
        usdValue,
        receipt.fee.formatted,
        receipt.memo,
    ];

    return fields.map(f => csvEscape(f)).join(',');
}

export function generateReceiptCsv(receipt: FormattedReceipt, signature: string, usdValue?: string): void {
    const header = CSV_HEADERS.join(',');
    const row = buildReceiptCsvRow(receipt, signature, usdValue);
    const csv = `${header}\n${row}`;

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
