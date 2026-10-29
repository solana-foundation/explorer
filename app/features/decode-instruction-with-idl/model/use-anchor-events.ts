import { Idl, Program } from '@coral-xyz/anchor';
import { type InstructionEvent, type InstructionNode, useInstructionSurface } from '@entities/instruction-card';
import { extractEventsFromLogs } from '@entities/program-logs';
import { useTransactionDetails } from '@providers/transactions';
import { useMemo } from 'react';

import { decodeProgramEvents } from '../lib/decode-program-events';

export function useAnchorEvents(node: InstructionNode, program: Program<Idl>): InstructionEvent[] {
    const { signature } = useInstructionSurface();
    const details = useTransactionDetails(signature);
    return useMemo(() => {
        const transactionWithMeta = details?.data?.transactionWithMeta;
        if (!transactionWithMeta) return [];

        const logMessages = transactionWithMeta.meta?.logMessages;
        if (!logMessages) return [];

        const instructionProgramIds = transactionWithMeta.transaction.message.instructions.map(i =>
            i.programId.toBase58(),
        );

        const payloads = extractEventsFromLogs({
            childIndex: node.childIndex,
            index: node.index,
            instructionProgramIds,
            logs: logMessages,
        });
        return decodeProgramEvents(payloads, program);
    }, [details, node.childIndex, node.index, program]);
}
