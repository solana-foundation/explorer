import type { InstructionParser } from '@entities/instruction-parser';

import {
    parseVoteKitInstruction,
    parseVoteRpcInstruction,
    VOTE_PARSER_LABEL,
    VOTE_PROGRAM_ADDRESS,
    type VoteParsed,
} from './vote-parser';

export const voteInstructionParser: InstructionParser<VoteParsed> = {
    fromParsed: parseVoteRpcInstruction,
    fromTransaction: parseVoteKitInstruction,
    programId: VOTE_PROGRAM_ADDRESS,
    programLabel: VOTE_PARSER_LABEL,
};
