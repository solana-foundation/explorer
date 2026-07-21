// The codama decode engine ('@explorer/idl-decode/codama') — the client's default; exported here for
// explicit wiring (a custom provider composes over the decode functions).
import type { IdlDecodeProvider } from '../types.js';

import { decodeAccountWithIdl } from './decode-account.js';
import { decodeInstructionWithIdl } from './decode-instruction.js';

export { decodeAccountWithIdl } from './decode-account.js';
export { decodeInstructionWithIdl } from './decode-instruction.js';

/** The codama-engine decode provider — decodes both standards via the codama pipeline. */
export function codamaProvider(): IdlDecodeProvider {
    return {
        decodeAccount: (idl, data, options) => decodeAccountWithIdl(idl, data, options),
        decodeInstruction: (idl, ix, options) => decodeInstructionWithIdl(idl, ix, options),
    };
}
