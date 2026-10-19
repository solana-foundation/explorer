import type { InstructionParser } from '@entities/instruction-parser';

import {
    parseStakeKitInstruction,
    parseStakeRpcInstruction,
    STAKE_PARSER_LABEL,
    STAKE_PROGRAM_ADDRESS,
    type StakeParsed,
} from './stake-parser';

export const stakeInstructionParser: InstructionParser<StakeParsed> = {
    fromParsed: parseStakeRpcInstruction,
    fromTransaction: parseStakeKitInstruction,
    programId: STAKE_PROGRAM_ADDRESS,
    programLabel: STAKE_PARSER_LABEL,
};
