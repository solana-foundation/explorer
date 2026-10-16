import { resolveMangoInstructionName } from '@explorer/decoder-mango/detection';
import type { KitInstruction, ParsedInstructionInfo, ParserProgramLabel } from '@explorer/parsers';

/** The RPC never pre-parses Mango, so this is a synthetic label carried through the dispatcher. */
export const MANGO_PROGRAM_LABEL = 'mango' satisfies ParserProgramLabel;

/** Mango v3 is decoded by name only: `type` is the instruction's display name and there is no payload. */
export type MangoParsed = ParsedInstructionInfo<string, Record<string, never>>;

/**
 * Resolve a raw Mango v3 instruction to its name. Returns `undefined` for a missing or unknown
 * discriminator, so the dispatcher emits an `UnparsedInstruction` and the card falls back.
 */
export function parseMangoInstruction(ix: KitInstruction): MangoParsed | undefined {
    const name = resolveMangoInstructionName(ix.programAddress, ix.data);
    return name === undefined ? undefined : { info: {}, type: name };
}
