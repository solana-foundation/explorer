import type { InstructionParser } from '@entities/instruction-parser';

import {
    ED25519_PROGRAM_ADDRESS,
    ED25519_PROGRAM_LABEL,
    type Ed25519Parsed,
    parseEd25519Instruction,
} from './ed25519-parser';

export const ed25519InstructionParser: InstructionParser<Ed25519Parsed> = {
    // No `fromParsed` — the RPC never pre-parses the precompile, so only the byte path applies.
    fromTransaction: parseEd25519Instruction,
    programId: ED25519_PROGRAM_ADDRESS,
    programLabel: ED25519_PROGRAM_LABEL,
};
