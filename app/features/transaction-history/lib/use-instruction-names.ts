import { useCluster } from '@providers/cluster';
import { getTransactionInstructionNames, TransactionInstructionInfo } from '@utils/instruction';
import useSWR from 'swr';

import { fetchParsedTransactionSequential } from './transaction-queue';

/**
 * Resolves instruction names for a single transaction signature.
 * Uses a global sequential queue to avoid rate-limit (429) errors.
 * Returns null while loading, empty array if no instructions found.
 */
export function useInstructionNames(signature: string, enabled = true): TransactionInstructionInfo[] | null {
    const { url } = useCluster();
    const { data } = useSWR(
        enabled ? `instruction-names:${url}:${signature}` : null,
        async () => {
            const tx = await fetchParsedTransactionSequential(signature, url);
            return tx ? getTransactionInstructionNames(tx) : [];
        },
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        },
    );
    return data ?? null;
}
