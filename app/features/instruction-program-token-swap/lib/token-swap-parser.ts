import { parseTokenSwapInstructionTitle } from '@explorer/decoder-token-swap/detection';
import type { KitInstruction, ParsedInstructionInfo, ParserProgramLabel } from '@explorer/parsers';

import { Logger } from '@/app/shared/lib/logger';

/** The RPC never pre-parses Token Swap, so this is a synthetic label carried through the dispatcher. */
export const TOKEN_SWAP_PROGRAM_LABEL = 'token-swap' satisfies ParserProgramLabel;

/** Token Swap is decoded by name only: `type` is the instruction's display name and there is no payload. */
export type TokenSwapParsed = ParsedInstructionInfo<string, Record<string, never>>;

/**
 * Resolve a raw Token Swap instruction to its name. Returns `undefined` for empty data or an
 * unrecognized tag, so the dispatcher emits an `UnparsedInstruction` and the card titles it "Unknown".
 */
export function parseTokenSwapInstruction(ix: KitInstruction): TokenSwapParsed | undefined {
    try {
        return { info: {}, type: parseTokenSwapInstructionTitle(ix.programAddress, ix.data) };
    } catch (error) {
        // Surface stale-name-table drift (a new tag) rather than degrading to "Unknown" silently.
        Logger.error(error, { programId: ix.programAddress });
        return undefined;
    }
}
