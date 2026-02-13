'use client';

import { useCluster } from '@providers/cluster';
import { ParsedTransactionWithMeta } from '@solana/web3.js';
import Link from 'next/link';
import useSWR from 'swr';

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
        { revalidateOnFocus: false }
    );

    if (!isReceiptEnabled || !receipt) {
        return null;
    }

    return (
        <Link
            className="btn btn-white btn-sm me-2"
            href={receiptPath}
            onClick={() => receiptAnalytics.trackButtonClicked(signature)}
        >
            View Receipt
        </Link>
    );
}
