import {
    type DecodedSerumInstruction,
    decodeSerumInstruction,
    isDeprecatedSerumProgram,
    isUndecodableSerumInstructionName,
    resolveSerumInstructionKey,
    type SerumInstructionName,
} from '@explorer/decoder-serum';
import type { KitInstruction, ParserProgramLabel } from '@explorer/parsers';

import { Logger } from '@/app/shared/lib/logger';

/** The RPC never pre-parses the DEX, so this is a synthetic label carried through the dispatcher. */
export const SERUM_PROGRAM_LABEL = 'serum' satisfies ParserProgramLabel;

/**
 * A DEX instruction that is named but carries no decoded fields: any instruction on a deprecated
 * Serum deployment, or an active-deployment instruction the vendored layout cannot decode.
 */
export type NameOnlySerumInstruction = { type: SerumInstructionName; info: Record<string, never> };

export type SerumParsed = DecodedSerumInstruction | NameOnlySerumInstruction;

/**
 * Parse a raw OpenBook / Serum DEX instruction into the canonical `{ type, info }` shape the
 * dispatcher consumes. Dead Serum deployments are never decoded, and codes 7/8/9/13 have no
 * vendored layout, so both surface name-only. A recognized code whose payload fails to decode
 * also surfaces name-only. Returns `undefined` when the code is unrecognized or too short to
 * read, so the card falls back to raw hex.
 */
export function parseSerumInstruction(ix: KitInstruction): SerumParsed | undefined {
    const deprecated = isDeprecatedSerumProgram(ix.programAddress);
    const name = resolveSerumInstructionKey(ix.data);

    if (name !== undefined && (deprecated || isUndecodableSerumInstructionName(name))) {
        return { info: {}, type: name };
    }
    if (deprecated) {
        return undefined;
    }
    try {
        return decodeSerumInstruction(ix);
    } catch (error) {
        Logger.error(error, { programId: ix.programAddress });
        return name === undefined ? undefined : { info: {}, type: name };
    }
}
