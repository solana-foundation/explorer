'use client';

import { FetchStatus } from '@providers/cache';
import { useCallback } from 'react';

import { useFetchRawTransaction, useRawTransactionDetails } from '@/app/providers/transactions/raw';

import { BaseTransactionRawData } from './BaseTransactionRawData';

// Per-row container for the lazily-fetched raw transaction bytes — fetched on hover, handed to the pure
// card as the row's `rawDataCell`.
export function TransactionRawDataCell({ signature }: { signature: string }) {
    const fetchRaw = useFetchRawTransaction();
    const rawDetails = useRawTransactionDetails(signature);
    const data = rawDetails?.data?.raw?.messageBytes;
    const loading = rawDetails?.status === FetchStatus.Fetching;

    const onHover = useCallback(() => {
        if (!data) {
            fetchRaw(signature);
        }
    }, [data, signature, fetchRaw]);

    return <BaseTransactionRawData signature={signature} data={data} loading={loading} onHover={onHover} />;
}
