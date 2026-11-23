'use client';

import type { TransactionWithMeta } from '@entities/transaction-data';
import Link from 'next/link';
import { FileText } from 'react-feather';

import { Button } from '@/app/components/shared/ui/button';
import { receiptAnalytics } from '@/app/shared/lib/analytics';

import { isReceiptEnabled } from '../env';
import { useReceiptResult } from '../model/use-receipt-result';

interface ViewReceiptButtonProps {
    signature: string;
    receiptPath: string;
    transactionWithMeta: TransactionWithMeta | null | undefined;
}

// FIXME: missing Storybook story — gated on NEXT_PUBLIC_RECEIPT_ENABLED + needs a populated transactionWithMeta to render.
export function ViewReceiptButton({ signature, receiptPath, transactionWithMeta }: ViewReceiptButtonProps) {
    const { data: receiptResult } = useReceiptResult(signature, transactionWithMeta);

    if (!isReceiptEnabled || receiptResult?.kind !== 'ok') {
        return null;
    }

    return (
        <Button variant="outline" size="sm" asChild>
            <Link
                href={receiptPath}
                onClick={() => receiptAnalytics.trackButtonClicked(signature)}
                aria-label="View Receipt"
            >
                <FileText />
                <span className="hidden sm:inline">View Receipt</span>
            </Link>
        </Button>
    );
}
