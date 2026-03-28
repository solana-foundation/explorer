'use client';

import { useCluster } from '@providers/cluster';
import { ParsedTransactionWithMeta } from '@solana/web3.js';
import Link from 'next/link';
import { FileText } from 'react-feather';
import useSWR from 'swr';

import { Button } from '@/app/components/shared/ui/button';
import { receiptAnalytics } from '@/app/shared/lib/analytics';

import { isReceiptEnabled } from '../env';
import { extractReceiptData } from '../model/create-receipt';

interface ViewReceiptButtonProps {
    signature: string;
    receiptPath: string;
    transactionWithMeta: ParsedTransactionWithMeta | null | undefined;
}

export function ViewReceiptButton({ signature, receiptPath, transactionWithMeta }: ViewReceiptButtonProps) {
    const { cluster } = useCluster();

    const { data: receipt } = useSWR(
        isReceiptEnabled && transactionWithMeta ? ['receipt', signature, cluster] : null,
        () => {
            if (!transactionWithMeta) return undefined;
            return extractReceiptData(transactionWithMeta, cluster);
        },
        { revalidateOnFocus: false },
    );

    if (!isReceiptEnabled || !receipt) {
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
                <span className="e-hidden sm:e-inline">View Receipt</span>
            </Link>
        </Button>
    );
}
