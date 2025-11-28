import type { TransactionError } from '@solana/web3.js';

import { useCluster } from '@/app/providers/cluster';
import { parseProgramLogs } from '@/app/utils/program-logs';

export function useParsedLogs(error: TransactionError | null) {
    const { cluster } = useCluster();

    const parseLogs = (logs: string[]) => parseProgramLogs(logs, error, cluster);

    return { parseLogs };
}
