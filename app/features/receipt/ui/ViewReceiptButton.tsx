'use client';

import { useCluster } from '@providers/cluster';
import { ParsedTransactionWithMeta } from '@solana/web3.js';
import Link from 'next/link';
import useSWR from 'swr';

import { extractReceiptData } from '../model/create-receipt';

interface ViewReceiptButtonProps {
    receiptPath: string;
    transactionWithMeta: ParsedTransactionWithMeta | null | undefined;
}

export function ViewReceiptButton({ receiptPath, transactionWithMeta }: ViewReceiptButtonProps) {
    const { cluster } = useCluster();

    const { data: receipt } = useSWR(transactionWithMeta ? ['receipt', transactionWithMeta, cluster] : null, () =>
        extractReceiptData(transactionWithMeta!, cluster)
    );

    if (!receipt) {
        return null;
    }

    return (
        <Link className="btn btn-white btn-sm me-2" href={receiptPath}>
            View Receipt
        </Link>
    );
}
