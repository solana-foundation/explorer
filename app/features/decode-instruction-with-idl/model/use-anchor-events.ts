import { Idl, Program } from '@coral-xyz/anchor';
import { extractEventsFromLogs } from '@entities/program-logs';
import { useTransactionDetails } from '@providers/transactions';
import { useMemo } from 'react';

import { decodeProgramEvents, type EventEntry } from '../lib/decode-program-events';

export function useAnchorEvents(
    { childIndex, index, signature }: { childIndex?: number; index: number; signature: string },
    program: Program<Idl>,
): EventEntry[] {
    const details = useTransactionDetails(signature);
    return useMemo(() => {
        const transactionWithMeta = details?.data?.transactionWithMeta;
        if (!transactionWithMeta) return [];

        const logMessages = transactionWithMeta.meta?.logMessages;
        if (!logMessages) return [];

        const programIds = transactionWithMeta.transaction.message.instructions.map(i => i.programId.toBase58());

        const payloads = extractEventsFromLogs({ childIndex, index, logs: logMessages, programIds });
        return decodeProgramEvents(payloads, program);
    }, [details, childIndex, index, program]);
}
