import type { InstructionParser } from '@entities/instruction-parser';

import {
    parseSolanaAttestationKitInstruction,
    SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS,
    SOLANA_ATTESTATION_SERVICE_PROGRAM_LABEL,
    type SolanaAttestationParsed,
} from './sas-parser';

export const solanaAttestationInstructionParser: InstructionParser<SolanaAttestationParsed> = {
    // No `fromParsed` — the RPC never pre-parses this program, so only the byte path applies.
    fromTransaction: parseSolanaAttestationKitInstruction,
    programId: SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS,
    programLabel: SOLANA_ATTESTATION_SERVICE_PROGRAM_LABEL,
};
