'use client';

import { useProgramIdlNames } from '@entities/idl/@x/transaction-data';
import { useCluster } from '@providers/cluster';
import { useMemo } from 'react';

import { toNamedInstruction } from '../lib/instruction-summary';
import { applyNameSources, applyNameSourcesToSummaries } from '../lib/name-sources';
import type { InstructionNameLookup, InstructionSummary, NamedInstruction } from '../lib/types';
import type { TransactionWithMeta } from './types';

/**
 * One row for each top-level instruction of an RPC-parsed transaction, Compute Budget included, so the
 * rows stay in the order of the transaction's logs. No rows while the transaction loads.
 */
export function useTransactionInstructionNames(
    transactionWithMeta: TransactionWithMeta | null | undefined,
): NamedInstruction[] {
    const rows = useMemo(
        () => transactionWithMeta?.transaction.message.instructions.map(toNamedInstruction) ?? [],
        [transactionWithMeta],
    );

    return useResolvedInstructionNames(rows);
}

/**
 * The second half of instruction naming: fetch the IDLs the unnamed rows need, then run every name
 * source. Row count and order are preserved, so a caller that pairs the rows with the log
 * invocations in order gets the right invocation for each row.
 * @param instructions - Rows in transaction order, each carrying its program
 */
export function useResolvedInstructionNames(instructions: readonly NamedInstruction[]): NamedInstruction[] {
    const idlNames = useIdlNames(instructions);

    return useMemo(
        () =>
            instructions.map(row => ({
                ...applyNameSources(row, idlNames),
                data: row.data,
                programId: row.programId,
            })),
        [instructions, idlNames],
    );
}

/**
 * `useResolvedInstructionNames` for summary rows. `undefined` passes through, so a caller can hand over
 * a still-loading transaction.
 * @param summaries - Summary rows for one signature, names still at their sentinels
 */
export function useResolvedSummaryNames(
    summaries: readonly InstructionSummary[] | undefined,
): readonly InstructionSummary[] | undefined {
    const idlNames = useIdlNames(summaries ?? NO_ROWS);

    return useMemo(
        () => (summaries === undefined ? undefined : applyNameSourcesToSummaries(summaries, idlNames)),
        [summaries, idlNames],
    );
}

// Stable identity, so absent rows do not recompute `programIds` every render.
const NO_ROWS: readonly { nameLookup?: InstructionNameLookup }[] = [];

/**
 * IDL names for the programs in `rows`, fetched once for the whole set. A row still carrying a
 * `nameLookup` is a row still unnamed, so those are the only programs worth fetching — and reading only
 * that field is why summary rows and named instructions both fit.
 */
function useIdlNames(rows: readonly { nameLookup?: InstructionNameLookup }[]) {
    const { cluster, url } = useCluster();

    const programIds = useMemo(
        () => rows.flatMap(({ nameLookup }) => (nameLookup ? [nameLookup.programId] : [])),
        [rows],
    );

    return useProgramIdlNames(programIds, cluster, url);
}
