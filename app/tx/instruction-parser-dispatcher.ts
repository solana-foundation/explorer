// Deep lib imports for the slices: their barrels also export 'use client' UI cards, which server
// consumers of this dispatcher (the /mcp route) must not pull in. The contract itself is React-free
// in @explorer/parsers.
import { createInstructionParserDispatcher } from '@explorer/parsers';
import { associatedTokenInstructionParser } from '@features/decode-instruction-associated-token/lib/associated-token-client';
import { bpfUpgradeableLoaderInstructionParser } from '@features/decode-instruction-bpf-upgradeable-loader/lib/bpf-upgradeable-loader-client';
import { lighthouseInstructionParser } from '@features/decode-instruction-lighthouse/lib/lighthouse-client';
import { systemInstructionParser } from '@features/decode-instruction-system/lib/system-client';
import { tokenInstructionParser } from '@features/decode-instruction-token/lib/token-client';
import { token2022InstructionParser } from '@features/decode-instruction-token-2022/lib/token-2022-client';
import { metaplexTokenMetadataInstructionParser } from '@features/mpl-token-metadata/lib/metaplex-token-metadata-client';

export const instructionParserDispatcher = createInstructionParserDispatcher([
    systemInstructionParser,
    tokenInstructionParser,
    token2022InstructionParser,
    associatedTokenInstructionParser,
    metaplexTokenMetadataInstructionParser,
    bpfUpgradeableLoaderInstructionParser,
    lighthouseInstructionParser,
]);
