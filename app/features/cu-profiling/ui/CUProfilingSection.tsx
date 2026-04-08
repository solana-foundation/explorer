import { CUProfilingCard, formatInstructionLogs } from '@entities/compute-unit';
import { useCluster } from '@providers/cluster';
import { useTransactionDetails } from '@providers/transactions';
import type { ParsedTransactionWithMeta } from '@solana/web3.js';
import type { Cluster } from '@utils/cluster';
import { getEpochForSlot } from '@utils/epoch-schedule';
import type { SignatureProps } from '@utils/index';
import { type InstructionLogs, parseProgramLogs } from '@utils/program-logs';
import React from 'react';

export function CUProfilingSection({ signature }: SignatureProps) {
    const details = useTransactionDetails(signature);
    const { cluster, clusterInfo } = useCluster();

    const transactionWithMeta = details?.data?.transactionWithMeta;
    const logMessages = transactionWithMeta?.meta?.logMessages || null;
    const unitsConsumed = transactionWithMeta?.meta?.computeUnitsConsumed || undefined;
    const slot = transactionWithMeta?.slot;

    const instructionLogs: InstructionLogs[] = React.useMemo(
        () => formatTransactionLogs(transactionWithMeta, cluster),
        [transactionWithMeta, cluster],
    );

    const instructionsForCU = React.useMemo(() => {
        if (!transactionWithMeta || !slot || !clusterInfo) return [];

        const epoch = getEpochForSlot(clusterInfo.epochSchedule, BigInt(slot));

        return formatInstructionLogs({
            cluster,
            epoch,
            instructionLogs,
            instructions: transactionWithMeta.transaction.message.instructions,
        });
    }, [transactionWithMeta, instructionLogs, cluster, slot, clusterInfo]);

    if (!logMessages || logMessages.length === 0) return null;
    if (instructionsForCU.length === 0) return null;

    return <CUProfilingCard instructions={instructionsForCU} unitsConsumed={unitsConsumed} />;
}

function formatTransactionLogs(transactionWithMeta: ParsedTransactionWithMeta | null | undefined, cluster: Cluster) {
    const logMessages = transactionWithMeta?.meta?.logMessages || null;
    const err = transactionWithMeta?.meta?.err || null;

    return logMessages ? parseProgramLogs(logMessages, err, cluster) : [];
}
