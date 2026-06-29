import { createInstructionParserDispatcher } from '@entities/instruction-parser';
import { associatedTokenInstructionParser } from '@features/decode-instruction-associated-token';
import { bpfUpgradeableLoaderInstructionParser } from '@features/decode-instruction-bpf-upgradeable-loader';
import { systemInstructionParser } from '@features/decode-instruction-system';
import { tokenInstructionParser } from '@features/decode-instruction-token';
import { token2022InstructionParser } from '@features/decode-instruction-token-2022';
import { metaplexTokenMetadataInstructionParser } from '@features/mpl-token-metadata';

export const instructionParserDispatcher = createInstructionParserDispatcher([
    systemInstructionParser,
    tokenInstructionParser,
    token2022InstructionParser,
    associatedTokenInstructionParser,
    metaplexTokenMetadataInstructionParser,
    bpfUpgradeableLoaderInstructionParser,
]);
