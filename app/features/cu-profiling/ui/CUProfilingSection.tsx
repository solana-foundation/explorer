import { BaseCUProfilingCard, toInstructionCUData, type TransactionOutcome } from '@entities/compute-unit';
import { parseProgramLogs } from '@entities/program-logs';
import { useTransactionInstructionNames } from '@entities/transaction-data/client';
import { useTransactionDetails } from '@providers/transactions';
import type { SignatureProps } from '@utils/index';
import { getTransactionInstructionError } from '@utils/program-err';
import { useMemo } from 'react';

// FIXME: missing Storybook story — needs useTransactionDetails provider + TransactionWithMeta fixture.
export function CUProfilingSection({ signature }: SignatureProps) {
    const details = useTransactionDetails(signature);

    const transactionWithMeta = details?.data?.transactionWithMeta;
    const logMessages = transactionWithMeta?.meta?.logMessages || undefined;
    const unitsConsumed = transactionWithMeta?.meta?.computeUnitsConsumed || undefined;
    const error = transactionWithMeta?.meta?.err;
    const outcome = useMemo(
        (): TransactionOutcome =>
            error
                ? { failedInstructionIndex: getTransactionInstructionError(error)?.index, status: 'failed' }
                : { status: 'succeeded' },
        [error],
    );

    const logs = useMemo(() => parseProgramLogs(logMessages ?? []), [logMessages]);

    // Undefined names leave the card on its "Instruction #N" fallback, which is also what shows while the
    // IDL fetch is still in flight.
    const instructions = useTransactionInstructionNames(transactionWithMeta);

    const instructionsForCU = useMemo(
        () => toInstructionCUData({ instructions, logs, outcome }),
        [instructions, logs, outcome],
    );

    if (!logMessages || logMessages.length === 0) return undefined;

    if (instructionsForCU.length === 0) return undefined;

    return <BaseCUProfilingCard instructions={instructionsForCU} unitsConsumed={unitsConsumed} />;
}
