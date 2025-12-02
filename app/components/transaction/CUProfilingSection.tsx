import { CUProfilingCard } from '@components/transaction/CUProfilingCard';
import { InstructionCUData } from '@components/transaction/CUProfilingCard';
import { useCluster } from '@providers/cluster';
import { useTransactionDetails } from '@providers/transactions';
import { ParsedTransactionWithMeta } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { SignatureProps } from '@utils/index';
import { InstructionLogs, parseProgramLogs } from '@utils/program-logs';
import React from 'react';

export function CUProfilingSection({ signature }: SignatureProps) {
    const details = useTransactionDetails(signature);
    const { cluster } = useCluster();

    const transactionWithMeta = details?.data?.transactionWithMeta;
    const logMessages = transactionWithMeta?.meta?.logMessages || null;

    const instructionLogs: InstructionLogs[] = React.useMemo(
        () => formatTransactionLogs(transactionWithMeta, cluster),
        [transactionWithMeta, cluster]
    );

    const instructionsForCU = React.useMemo(() => {
        if (!transactionWithMeta) return [];

        return formatInstructionLogs({
            instructionLogs,
            instructions: transactionWithMeta.transaction.message.instructions,
        });
    }, [transactionWithMeta, instructionLogs]);

    if (!logMessages || logMessages.length === 0) return null;
    if (instructionsForCU.length === 0) return null;

    return <CUProfilingCard instructions={instructionsForCU} />;
}

export function formatTransactionLogs(
    transactionWithMeta: ParsedTransactionWithMeta | null | undefined,
    cluster: Cluster
) {
    const logMessages = transactionWithMeta?.meta?.logMessages || null;
    const err = transactionWithMeta?.meta?.err || null;

    return logMessages ? parseProgramLogs(logMessages, err, cluster) : [];
}

export function formatInstructionLogs({
    instructions,
    instructionLogs,
}: {
    instructions: Array<{ programId: { toBase58(): string } }>;
    instructionLogs: InstructionLogs[];
}): InstructionCUData[] {
    const result: InstructionCUData[] = [];

    instructions.forEach((instruction, index) => {
        const programId = instruction.programId.toBase58();

        const logEntry = instructionLogs[index];
        const computeUnits = logEntry?.computeUnits || 0;

        result.push({
            ...(computeUnits === 0 && { displayUnits: '~3,000' }),
            computeUnits,
            programId,
        });
    });

    return result;
}
