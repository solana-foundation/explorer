import type { TransactionError } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { parseProgramLogs } from '@utils/program-logs';

import { Logger } from '@/app/shared/lib/logger';

import type { ResultLogs } from './types';

/**
 * Build a ResultLogs (raw + parsed) for a transaction result.
 */
export function toResultLogs(raw: string[], error: TransactionError | null | undefined, cluster: Cluster): ResultLogs {
    try {
        return { parsed: parseProgramLogs(raw, error, cluster), raw };
    } catch (e) {
        Logger.error(new Error('Unable to parse program logs', { cause: e }), { sentry: true });
        return { parsed: [], raw };
    }
}
