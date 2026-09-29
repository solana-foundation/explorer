import {
    applyNameSourcesToSummaries,
    formatTransactionVersion,
    getInstructionSummaries,
    type InstructionSummary,
    type TransactionWithMeta,
} from '@entities/transaction-data';
import { isTimeoutError } from '@shared/lib/http-utils';
import { type ServerCluster } from '@utils/cluster';
import { displayTimestampUtc, unixTimestampToMs } from '@utils/date';
import { lamportsToSolString } from '@utils/index';

import { Logger } from '@/app/shared/lib/logger';

import { getIdlNames } from '../api/get-idl-names';
import { getTx } from '../api/get-tx';
import { MAX_INSTRUCTION_ROWS } from '../lib/constants';

/**
 * Data for the OG image rendering, already formatted.
 */
export type TxShareData = {
    signature: string;
    /** "Aug 31, 2026 at 11:00:00 UTC" */
    dateUtc: string;
    /** "0.000005 SOL". Absent when the RPC returned no `meta`, which carries both the fee and the result. */
    fee?: string;
    status?: 'success' | 'failed';
    instructions: InstructionSummary[];
    /** Required: every transaction the RPC returns was confirmed in a slot. */
    slot: number;
    /** Read from the first account key, which a message with none would not have. */
    signer?: string;
    version?: string;
};

type ErrorResult = { kind: 'error'; error: unknown };
type NotFoundResult = { kind: 'not-found' };
type BudgetTimeoutErrorResult = { kind: 'rpc-budget-timeout' };
export type TxShareResult = { kind: 'ok'; data: TxShareData } | ErrorResult | NotFoundResult | BudgetTimeoutErrorResult;

const RPC_BUDGET_MS = 1_200;

/**
 * The data behind `/og/tx/<signature>`, read from the cluster passed.
 *
 * Never throws: every failure becomes a result the route turns into a status code.
 * @param signature - The transaction signature from the route
 * @param cluster - The cluster from `?cluster=`
 */
export async function getTxShareData(signature: string, cluster: ServerCluster): Promise<TxShareResult> {
    try {
        const abortSignal = AbortSignal.timeout(RPC_BUDGET_MS);

        const tx = await getTx({ abortSignal, cluster, signature });
        if (!tx) return { kind: 'not-found' };

        // Summarize the instructions in the transaction.
        const summaries = getInstructionSummaries(tx);
        // Get names for the custom programs and their instructions.
        const names = await getIdlNames({ cluster: cluster, programIds: idlProgramIds(summaries) });
        const instructions = applyNameSourcesToSummaries(summaries, names);

        return { data: toShareData(signature, tx, instructions), kind: 'ok' };
    } catch (error) {
        // A slow RPC running out of budget is possible and not a fault, so we warn.
        if (isTimeoutError(error)) {
            Logger.warn('[transaction-share] Transaction request budget exceeded', {
                cluster,
                signature,
            });
            return { kind: 'rpc-budget-timeout' };
        }
        Logger.error(new Error('[transaction-share] Failed to get transaction share data', { cause: error }), {
            cluster,
            signature,
        });
        return { error, kind: 'error' };
    }
}

/**
 * The programs worth an IDL fetch:
 *
 * Only the first `MAX_INSTRUCTION_ROWS` instructions are considered, as rows past the cap collapse into "and N more", hence no fetch needed for them.
 */
function idlProgramIds(summaries: InstructionSummary[]): string[] {
    return summaries.slice(0, MAX_INSTRUCTION_ROWS).flatMap(s => (s.nameLookup ? [s.nameLookup.programId] : []));
}

/**
 * The fields the image prints.
 */
function toShareData(signature: string, tx: TransactionWithMeta, instructions: InstructionSummary[]): TxShareData {
    return {
        dateUtc: formatDateUtc(tx.blockTime),
        fee: tx.meta ? `${lamportsToSolString(tx.meta.fee)} SOL` : undefined,
        instructions,
        signature,
        // The fee payer is always the first account key, which is what the detail card reads too.
        signer: tx.transaction.message.accountKeys[0]?.pubkey.toBase58(),
        slot: tx.slot,
        status: tx.meta ? (tx.meta.err === null ? 'success' : 'failed') : undefined,
        version: tx.version === undefined ? undefined : formatTransactionVersion(tx.version),
    };
}

/** The same placeholder the transaction-history row prints for a transaction with no block time. */
function formatDateUtc(blockTime: number | null | undefined): string {
    if (!blockTime) return '-';
    return displayTimestampUtc(unixTimestampToMs(blockTime), true);
}
