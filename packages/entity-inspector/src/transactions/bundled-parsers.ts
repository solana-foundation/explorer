// Program decoders bundled with the package (shared with the app via @explorer/parsers) — the tool
// decodes these standalone, without the host-app fallback.
import type { InstructionParser } from '@explorer/parsers';
import { systemInstructionParser } from '@explorer/parsers/programs/system';

import type { DecodedInstructionInfo, FallbackInstruction } from './types.js';
import { toKitInstruction } from './to-kit-instruction.js';

function bundledParserFor(programId: string): InstructionParser | undefined {
    return [systemInstructionParser].find(parser => parser.programId === programId);
}

/** `undefined` means "no bundled parser or unrecognized discriminator" (cascade continues). */
export function decodeBundledInstruction(instruction: FallbackInstruction): DecodedInstructionInfo | undefined {
    const parser = bundledParserFor(instruction.programId);
    if (!parser) {
        return undefined;
    }

    const parsed = parser.fromTransaction(toKitInstruction(instruction));
    if (!parsed) {
        return undefined;
    }

    return { info: parsed.info, program: parser.programLabel, type: parsed.type };
}
