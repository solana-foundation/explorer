import type { InstructionParser } from '@entities/instruction-parser';

import {
    parseZkElGamalProofInstruction,
    ZK_ELGAMAL_PROOF_PROGRAM_ADDRESS,
    ZK_ELGAMAL_PROOF_PROGRAM_LABEL,
    type ZkElGamalProofParsed,
} from './zk-elgamal-proof-parser';

export const zkElGamalProofInstructionParser: InstructionParser<ZkElGamalProofParsed> = {
    // No `fromParsed` — the RPC never pre-parses this program, so only the byte path applies.
    fromTransaction: parseZkElGamalProofInstruction,
    programId: ZK_ELGAMAL_PROOF_PROGRAM_ADDRESS,
    programLabel: ZK_ELGAMAL_PROOF_PROGRAM_LABEL,
};
