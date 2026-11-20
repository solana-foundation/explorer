import { BaseCUProfilingCard, formatInstructionLogs } from '@entities/compute-unit';
import { type InstructionLogs, parseProgramLogs } from '@entities/program-logs';
import { type NamedInstruction, resolveInstructionNames, type TransactionWithMeta } from '@entities/transaction-data';
import { useResolvedInstructionNames } from '@entities/transaction-data/client';
import { useCluster } from '@providers/cluster';
import { useTransactionDetails } from '@providers/transactions';
import type { Cluster } from '@utils/cluster';
import type { SignatureProps } from '@utils/index';
import { useMemo } from 'react';

// FIXME: missing Storybook story — needs useTransactionDetails provider + TransactionWithMeta fixture.
export function CUProfilingSection({ signature }: SignatureProps) {
    const details = useTransactionDetails(signature);
    const { cluster } = useCluster();

    const transactionWithMeta = details?.data?.transactionWithMeta;
    const logMessages = transactionWithMeta?.meta?.logMessages || undefined;
    const unitsConsumed = transactionWithMeta?.meta?.computeUnitsConsumed || undefined;

    const instructionLogs: InstructionLogs[] = useMemo(
        () => formatTransactionLogs(transactionWithMeta, cluster),
        [transactionWithMeta, cluster],
    );

    // Every top-level instruction produces a row, Compute Budget included, so rows stay in the order of
    // the logs `instructionLogs` was parsed from.
    const named: NamedInstruction[] = useMemo(
        () =>
            transactionWithMeta?.transaction.message.instructions.map(ix => ({
                ...resolveInstructionNames(ix),
                programId: ix.programId,
            })) ?? [],
        [transactionWithMeta],
    );

    // Undefined names leave the card on its "Instruction #N" fallback, which is also what shows while the
    // IDL fetch is still in flight.
    const instructions = useResolvedInstructionNames(named);

    const instructionsForCU = useMemo(
        () => formatInstructionLogs({ instructionLogs, instructions }),
        [instructions, instructionLogs],
    );

    if (!logMessages || logMessages.length === 0) return undefined;

    if (instructionsForCU.length === 0) return undefined;

    return <BaseCUProfilingCard instructions={instructionsForCU} unitsConsumed={unitsConsumed} />;
}

function formatTransactionLogs(transactionWithMeta: TransactionWithMeta | null | undefined, cluster: Cluster) {
    const logMessages = transactionWithMeta?.meta?.logMessages || undefined;
    const err = transactionWithMeta?.meta?.err || undefined;

    return logMessages ? parseProgramLogs(logMessages, err, cluster) : [];
}
