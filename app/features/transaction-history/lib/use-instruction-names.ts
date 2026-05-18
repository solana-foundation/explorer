import { useCluster } from '@providers/cluster';
import { getTransactionInstructionNames, TransactionInstructionInfo } from '@utils/instruction';
import useSWR from 'swr';

import { fetchParsedTransactionSequential } from './transaction-queue';

/**
 * Resolves instruction names for a single transaction signature.
 * Uses a global sequential queue to avoid rate-limit (429) errors.
 * Returns null while loading, empty array if no instructions found.
 */
export function useInstructionNames(signature: string): TransactionInstructionInfo[] | null {
    const { url } = useCluster();
    const { data } = useSWR(
        `instruction-names:${url}:${signature}`,
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
