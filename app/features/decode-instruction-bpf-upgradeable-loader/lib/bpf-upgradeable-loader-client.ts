import type { InstructionParser } from '@entities/instruction-parser';

import {
    BPF_UPGRADEABLE_LOADER_PROGRAM_ID,
    BPF_UPGRADEABLE_LOADER_PROGRAM_LABEL,
    type BpfUpgradeableLoaderParsed,
    parseBpfUpgradeableLoaderInstruction,
    parseBpfUpgradeableLoaderRpcInstruction,
} from './bpf-upgradeable-loader-parser';

export const bpfUpgradeableLoaderInstructionParser: InstructionParser<BpfUpgradeableLoaderParsed> = {
    fromParsed: parseBpfUpgradeableLoaderRpcInstruction,
    fromTransaction: parseBpfUpgradeableLoaderInstruction,
    programId: BPF_UPGRADEABLE_LOADER_PROGRAM_ID,
    programLabel: BPF_UPGRADEABLE_LOADER_PROGRAM_LABEL,
};
