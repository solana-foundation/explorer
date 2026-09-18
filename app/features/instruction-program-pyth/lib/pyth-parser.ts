import { decodePythInstruction, type PythParsed } from '@explorer/decoder-pyth';
import type { KitInstruction, ParserProgramLabel } from '@explorer/parsers';

import { Logger } from '@/app/shared/lib/logger';

/** The RPC never pre-parses the oracle, so this is a synthetic label carried through the dispatcher. */
export const PYTH_PROGRAM_LABEL = 'pyth' satisfies ParserProgramLabel;

/**
 * Decode a raw Pyth oracle instruction into the canonical `{ type, info }` shape the
 * dispatcher consumes. Returns `undefined` for an unsupported version, unknown index, or
 * malformed payload, so the dispatcher emits an `UnparsedInstruction` and the card falls
 * back to raw hex.
 */
export function parsePythInstruction(ix: KitInstruction): PythParsed | undefined {
    try {
        return decodePythInstruction(ix);
    } catch (error) {
        // Surface stale-decoder drift (new index, changed layout) rather than degrading to raw hex silently.
        Logger.error(error, { programId: ix.programAddress });
        return undefined;
    }
}
