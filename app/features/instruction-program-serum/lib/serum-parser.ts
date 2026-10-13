import {
    type DecodedSerumInstruction,
    decodeSerumInstruction,
    isDeprecatedSerumProgram,
    isKnownUndecodableSerumInstruction,
} from '@explorer/decoder-serum';
import type { KitInstruction, ParserProgramLabel } from '@explorer/parsers';

import { Logger } from '@/app/shared/lib/logger';

/** The RPC never pre-parses the DEX, so this is a synthetic label carried through the dispatcher. */
export const SERUM_PROGRAM_LABEL = 'serum' satisfies ParserProgramLabel;

/**
 * Decode a raw OpenBook / Serum DEX instruction into the canonical `{ type, info }` shape the
 * dispatcher consumes. Returns `undefined` for the dead Serum deployments (they render name-only)
 * and for any payload the vendored layout cannot decode, so the card falls back to raw hex.
 */
export function parseSerumInstruction(ix: KitInstruction): DecodedSerumInstruction | undefined {
    if (isDeprecatedSerumProgram(ix.programAddress)) {
        return undefined;
    }
    try {
        return decodeSerumInstruction(ix);
    } catch (error) {
        // Codes 7/8/9/13 have no vendored layout and always throw here — telemetry only for unexpected failures.
        if (!isKnownUndecodableSerumInstruction(ix)) {
            Logger.error(error, { programId: ix.programAddress });
        }
        return undefined;
    }
}
