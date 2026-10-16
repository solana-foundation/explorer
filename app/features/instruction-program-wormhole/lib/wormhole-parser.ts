import { parseWormholeInstructionTitle } from '@explorer/decoder-wormhole/detection';
import type { KitInstruction, ParsedInstructionInfo, ParserProgramLabel } from '@explorer/parsers';

import { Logger } from '@/app/shared/lib/logger';

/** The RPC never pre-parses Wormhole, so this is a synthetic label carried through the dispatcher. */
export const WORMHOLE_PROGRAM_LABEL = 'wormhole' satisfies ParserProgramLabel;

/** Wormhole is decoded by name only: `type` is the instruction's display name and there is no payload. */
export type WormholeParsed = ParsedInstructionInfo<string, Record<string, never>>;

/**
 * Resolve a raw Wormhole instruction to its name. Returns `undefined` for empty data or an
 * unrecognized tag, so the dispatcher emits an `UnparsedInstruction` and the card titles it "Unknown".
 */
export function parseWormholeInstruction(ix: KitInstruction): WormholeParsed | undefined {
    try {
        return { info: {}, type: parseWormholeInstructionTitle(ix.programAddress, ix.data) };
    } catch (error) {
        // Surface stale-name-table drift (a new tag) rather than degrading to "Unknown" silently.
        Logger.error(error, { programId: ix.programAddress });
        return undefined;
    }
}
