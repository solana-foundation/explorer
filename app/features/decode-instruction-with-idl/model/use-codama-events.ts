import { type InstructionEvent, type InstructionNode, useInstructionSurface } from '@entities/instruction-card';
import { extractEventsFromLogs } from '@entities/program-logs';
import { useTransactionDetails } from '@providers/transactions';
import type { RootNode } from 'codama';
import { useMemo } from 'react';

import { decodeCodamaProgramEvents } from '../lib/decode-codama-program-events';

// Log-based events for the codama decode path (legacy programs and native codama IDLs) — the counterpart
// to useAnchorEvents, which needs a built anchor Program the legacy path cannot produce.
export function useCodamaEvents(node: InstructionNode, root: RootNode | undefined): InstructionEvent[] {
    const { signature } = useInstructionSurface();
    const details = useTransactionDetails(signature);
    return useMemo(() => {
        if (!root) return [];
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
        return decodeCodamaProgramEvents(payloads, root);
    }, [details, node.childIndex, node.index, root]);
}
