import type { ParsedInstructionInfo } from '@entities/instruction-parser';
import type { LighthouseInstructionType } from '@entities/lighthouse';
import type { AccountMeta } from '@solana/kit';

// The instruction-name type/map lives in @entities/lighthouse (shared with the
// transaction-history name resolver); re-exported here for the slice's consumers.
export type { LighthouseInstructionType };

export interface LighthouseInfo {
    /** Named accounts from the lighthouse-sdk parser (name → meta), used to label the account table. */
    accounts?: Record<string, AccountMeta<string>>;
    /** Decoded instruction data with assertion operators already humanized. */
    data: Record<string, unknown>;
}

export type LighthouseParsed = ParsedInstructionInfo<LighthouseInstructionType, LighthouseInfo>;
