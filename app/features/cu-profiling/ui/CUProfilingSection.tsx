import { BaseCUProfilingCard, toInstructionCUData } from '@entities/compute-unit';
import { parseProgramLogs } from '@entities/program-logs';
import { useTransactionInstructionNames } from '@entities/transaction-data/client';
import { useTransactionDetails } from '@providers/transactions';
import type { SignatureProps } from '@utils/index';
import { useMemo } from 'react';

// FIXME: missing Storybook story — needs useTransactionDetails provider + TransactionWithMeta fixture.
export function CUProfilingSection({ signature }: SignatureProps) {
    const details = useTransactionDetails(signature);

    const transactionWithMeta = details?.data?.transactionWithMeta;
    const logMessages = transactionWithMeta?.meta?.logMessages || undefined;
    const unitsConsumed = transactionWithMeta?.meta?.computeUnitsConsumed || undefined;

    const invocations = useMemo(() => parseProgramLogs(logMessages ?? []).invocations, [logMessages]);

    // Undefined names leave the card on its "Instruction #N" fallback, which is also what shows while the
    // IDL fetch is still in flight.
    const instructions = useTransactionInstructionNames(transactionWithMeta);

    const instructionsForCU = useMemo(
        () => toInstructionCUData({ instructions, invocations }),
        [instructions, invocations],
    );

    if (!logMessages || logMessages.length === 0) return undefined;

    if (instructionsForCU.length === 0) return undefined;

    return <BaseCUProfilingCard instructions={instructionsForCU} unitsConsumed={unitsConsumed} />;
}
