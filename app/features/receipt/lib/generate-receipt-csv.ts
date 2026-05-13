import { writeToString } from '@fast-csv/format';

import { getReceiptMint } from '@/app/entities/token-receipt';

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

function parseUsdNumber(usdValue: string): number | null {
    // eslint-disable-next-line no-restricted-syntax -- regex is the clearest way to strip currency formatting chars
    const n = parseFloat(usdValue.replace(/[$,]/g, ''));
    return isNaN(n) ? null : n;
}

function prorateUsd(transferRaw: number, totalRaw: number, totalUsd: number): string {
    if (totalRaw === 0) return '';
    const value = (transferRaw / totalRaw) * totalUsd;
    return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
}

export function buildReceiptCsvRows(receipt: FormattedReceipt, signature: string, usdValue?: string): string[][] {
    const mint = getReceiptMint(receipt);
    const unit = sanitizeCsvField(receipt.total.unit);

    if (receipt.transfers && receipt.transfers.length > 1) {
        const totalUsd = usdValue ? parseUsdNumber(usdValue) : null;
        const transferRows = receipt.transfers.map((t, i) => [
            receipt.date.utc,
            signature,
            receipt.network,
            t.sender.address,
            t.receiver.address,
            t.amount.formatted,
            unit,
            mint ?? '',
            totalUsd !== null ? prorateUsd(t.amount.raw, receipt.total.raw, totalUsd) : '',
            '',
            i === 0 && receipt.memo ? sanitizeCsvField(receipt.memo) : '',
        ]);
        const feeRow = [
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            receipt.fee.formatted,
            '',
        ];
        return [...transferRows, feeRow];
    }

    return [
        [
            receipt.date.utc,
            signature,
            receipt.network,
            receipt.sender.address,
            receipt.receiver.address,
            receipt.total.formatted,
            unit,
            mint ?? '',
            usdValue ?? '',
            receipt.fee.formatted,
            receipt.memo ? sanitizeCsvField(receipt.memo) : '',
        ],
    ];
}

export async function generateReceiptCsv(
    receipt: FormattedReceipt,
    signature: string,
    usdValue?: string,
): Promise<void> {
    const rows = buildReceiptCsvRows(receipt, signature, usdValue);
    const csv = await writeToString(rows, { headers: [...CSV_HEADERS] });

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
