// Deep lib/model imports throughout: the slice barrels also export 'use client' UI cards (and the
// entity barrel the React provider), which server consumers of this dispatcher (the /mcp route)
// must not pull in.
import { createInstructionParserDispatcher } from '@entities/instruction-parser/model/dispatcher';
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
