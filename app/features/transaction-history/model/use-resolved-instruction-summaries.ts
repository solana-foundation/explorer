import { useResolvedSummaryNames } from '@entities/transaction-data/client';

import { type InstructionSummariesState, useInstructionSummaries } from './use-instruction-summaries';

/**
 * Instruction summaries for one signature with their program and instruction names resolved from each
 * program's name source. Resolution is lifted here so the list/line components stay pure — they render
 * names, never fetch them. `enabled` gates the underlying (queued) transaction fetch so callers can defer
 * it until a row is visible.
 */
export function useResolvedInstructionSummaries(signature: string, enabled = true): InstructionSummariesState {
    const state = useInstructionSummaries(signature, enabled);
    const summaries = useResolvedSummaryNames(state.status === 'loaded' ? state.summaries : undefined);

    return state.status === 'loaded' && summaries ? { status: 'loaded', summaries } : state;
}
