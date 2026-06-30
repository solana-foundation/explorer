import type { ParsedInstructionInfo } from '@entities/instruction-parser';
import type { LighthouseInstructionType } from '@entities/lighthouse';
import type { AccountMeta } from '@solana/kit';

// The instruction-name type/map lives in @entities/lighthouse (shared with the
// transaction-history name resolver); re-exported here for the slice's consumers.
export type { LighthouseInstructionType };

export interface LighthouseInfo {
    /** Named accounts from the lighthouse-sdk parser (name → meta), used to label the account table. */
    accounts?: Record<string, AccountMeta<string>>;
    /**
     * Decoded instruction data with assertion operators kept as raw numeric
     * enums — the decode is faithful. Call `withFormattedOperators` at the
     * render boundary to humanize them into comparison symbols (the card does).
     */
    data: Record<string, unknown>;
}

export type LighthouseParsed = ParsedInstructionInfo<LighthouseInstructionType, LighthouseInfo>;
