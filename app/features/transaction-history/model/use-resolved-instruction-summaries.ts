import { type InstructionSummary } from '@entities/transaction-data';
import { useResolvedSummaryNames } from '@entities/transaction-data/client';

import { useInstructionSummaries } from './use-instruction-summaries';

/**
 * Instruction summaries for one signature with their program and instruction names resolved from each
 * program's name source. Resolution is lifted here so the list/line components stay pure — they render
 * names, never fetch them. `enabled` gates the underlying (queued) transaction fetch so callers can defer
 * it until a row is visible.
 */
export function useResolvedInstructionSummaries(signature: string, enabled = true): InstructionSummary[] | undefined {
    return useResolvedSummaryNames(useInstructionSummaries(signature, enabled));
}
