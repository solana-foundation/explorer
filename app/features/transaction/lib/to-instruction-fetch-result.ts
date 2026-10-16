import type { InstructionFetchResult } from '@entities/instruction-intent';
import { getInstructionsFromRawTransaction, type RawTransaction } from '@entities/transaction-data';
import type { KitInstruction } from '@explorer/parsers';
import { FetchStatus } from '@providers/cache';

import { Logger } from '@/app/shared/lib/logger';

/** The instruction one top-level card on the transaction page builds its intent from, read from the raw transaction. */
export function toInstructionFetchResult({
    fetchStatus,
    instructions,
    index,
}: {
    fetchStatus: FetchStatus | undefined;
    instructions: readonly KitInstruction[] | undefined;
    index: number;
}): InstructionFetchResult {
    const instruction = instructions?.[index];
    if (instruction) return { instruction, status: 'success' };
    if (fetchStatus === undefined || fetchStatus === FetchStatus.Fetching) return { status: 'loading' };
    return { status: 'failed' };
}

export function readRawInstructions(raw: RawTransaction): KitInstruction[] | undefined {
    try {
        return getInstructionsFromRawTransaction(raw);
    } catch (error) {
        Logger.error(new Error('Could not decompile the raw transaction instructions', { cause: error }), {
            sentry: true,
        });
        return undefined;
    }
}
