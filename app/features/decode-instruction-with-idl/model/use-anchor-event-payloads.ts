import { extractEventsFromLogs, type ProgramEventPayload } from '@entities/program-logs';
import { useTransactionDetails } from '@providers/transactions';
import { useMemo } from 'react';

// Event payloads emitted by this instruction, recovered from the transaction's log messages. Returns
// undefined when the tx isn't loaded or the instruction logged no events (e.g. the inspector, which
// renders without a signature). Split out of AnchorDetailsCard so the card stays presentational.
export function useAnchorEventPayloads({
    signature,
    index,
}: {
    signature: string;
    index: number;
}): ProgramEventPayload[] | undefined {
    const details = useTransactionDetails(signature);
    return useMemo(() => {
        const transactionWithMeta = details?.data?.transactionWithMeta;
        if (!transactionWithMeta) return undefined;

        const logMessages = transactionWithMeta.meta?.logMessages;
        if (!logMessages) return undefined;

        // Ordered top-level program ids let extractEventsFromLogs map invocations to instruction
        // indices even when non-logging precompiles (ed25519/secp256k1) sit between them.
        const programIds = transactionWithMeta.transaction.message.instructions.map(i => i.programId.toBase58());

        const eventPayloads = extractEventsFromLogs(logMessages, index, programIds);
        return eventPayloads.length === 0 ? undefined : eventPayloads;
    }, [details, index]);
}
