import { parseProgramLogs, toInstructionLogRows } from '@entities/program-logs';
import type { TransactionError } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { getTransactionInstructionError } from '@utils/program-err';

import type { ResultLogs } from './types';

/**
 * Build a ResultLogs (raw lines + rows) for a transaction result.
 */
export function toResultLogs(raw: string[], error: TransactionError | null | undefined, cluster: Cluster): ResultLogs {
    const rows = toInstructionLogRows({
        cluster,
        error: getTransactionInstructionError(error),
        instructions: undefined,
        logs: parseProgramLogs(raw),
    });

    return { raw, rows };
}
