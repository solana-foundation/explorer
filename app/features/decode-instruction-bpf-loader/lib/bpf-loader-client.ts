import type { InstructionParser } from '@entities/instruction-parser';

import {
    BPF_LOADER_PARSER_LABEL,
    BPF_LOADER_PROGRAM_ADDRESS,
    type BpfLoaderParsed,
    parseBpfLoaderKitInstruction,
    parseBpfLoaderRpcInstruction,
} from './bpf-loader-parser';

export const bpfLoaderInstructionParser: InstructionParser<BpfLoaderParsed> = {
    fromParsed: parseBpfLoaderRpcInstruction,
    fromTransaction: parseBpfLoaderKitInstruction,
    programId: BPF_LOADER_PROGRAM_ADDRESS,
    programLabel: BPF_LOADER_PARSER_LABEL,
};
