import { lookupTokenInfo } from '@entities/token-info';
import type { TransactionWithMeta } from '@entities/transaction-data';
import { useCluster } from '@providers/cluster';
import useSWR, { type SWRResponse } from 'swr';

import { isReceiptEnabled } from '../env';
import { extractReceiptData, type ReceiptResult } from './receipt-data';

export function useReceiptResult(
    signature: string,
    tx: TransactionWithMeta | null | undefined,
): SWRResponse<ReceiptResult | undefined> {
    const { cluster, genesisHash } = useCluster();

    return useSWR(
        isReceiptEnabled && tx ? ['receipt', signature, cluster, genesisHash] : undefined,
        () => {
            if (!tx) return undefined;
            return extractReceiptData({
                cluster,
                lookupTokenInfo: mint => lookupTokenInfo({ cluster, genesisHash, mint }),
                tx,
            });
        },
        { revalidateOnFocus: false },
    );
}
