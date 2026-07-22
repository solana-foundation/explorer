// The parsing contract. Transitional web3.js shims live under '@explorer/parsers/compat'.
export { createInstructionParserDispatcher } from './dispatcher.js';
export type { KitInstruction } from './kit-instruction.js';
export { isParsedInstruction } from './types.js';
export type {
    DispatchResult,
    InstructionParser,
    InstructionParserDispatcher,
    ParsedInstructionInfo,
    ParserProgramLabel,
    UnparsedInstruction,
} from './types.js';
