import type { InstructionParser } from '@entities/instruction-parser';
import { MPL_TOKEN_METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';

import { type MetaplexInstructionType, parseMetaplexTokenMetadataInstruction } from './metaplex-token-metadata-parser';

/**
 * Canonical shape for a parsed MPL Token Metadata instruction. RPC doesn't
 * parse this program, so the slice only implements `fromTransaction` — the
 * tx-page path for MPL goes through the predicate-based raw dispatch on the
 * existing `transaction/InstructionsSection` and never enters this slice's
 * `fromParsed`.
 */
export type MetaplexTokenMetadataParsed = { type: MetaplexInstructionType; info: Record<string, unknown> };

export const metaplexTokenMetadataInstructionParser: InstructionParser<MetaplexTokenMetadataParsed> = {
    fromTransaction: parseMetaplexTokenMetadataInstruction,
    programId: MPL_TOKEN_METADATA_PROGRAM_ID,
    programLabel: 'mpl-token-metadata',
};
