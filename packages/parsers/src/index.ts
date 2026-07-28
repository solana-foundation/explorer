// The parsing contract. Transitional web3.js shims live under '@explorer/parsers/compat'.
export { createInstructionParserDispatcher } from './dispatcher.js';
export type { KitInstruction } from './kit-instruction.js';
export {
    isRpcParsedAccountProgram,
    isTokenProgram,
    ADDRESS_LOOKUP_TABLE_PROGRAM_LABEL,
    BPF_UPGRADEABLE_LOADER_PROGRAM_LABEL,
    CONFIG_PROGRAM_LABEL,
    NONCE_PROGRAM_LABEL,
    SPL_TOKEN_PROGRAM_LABEL,
    SPL_TOKEN_2022_PROGRAM_LABEL,
    STAKE_PROGRAM_LABEL,
    SYSVAR_PROGRAM_LABEL,
    VOTE_PROGRAM_LABEL,
    RPC_PARSED_ACCOUNT_PROGRAMS,
    rpcParsedAccountProgram,
    TOKEN_PROGRAMS,
    tokenProgram,
} from './program-registry.js';
export type { RpcParsedAccountProgram, TokenProgram } from './program-registry.js';
export { isParsedInstruction } from './types.js';
export type {
    DispatchResult,
    InstructionParser,
    InstructionParserDispatcher,
    ParsedInstructionInfo,
    ParserProgramLabel,
    UnparsedInstruction,
} from './types.js';
