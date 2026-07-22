// The parsing contract lives in @explorer/parsers; only the React provider remains app-side.
export {
    createInstructionParserDispatcher,
    type DispatchResult,
    type InstructionParser,
    type InstructionParserDispatcher,
    isParsedInstruction,
    type ParsedInstructionInfo,
    type ParserProgramLabel,
    type UnparsedInstruction,
} from '@explorer/parsers';
export { toParsedInstruction, toParsedTransaction } from '@explorer/parsers/compat';

export { InstructionParserProvider, useInstructionParser } from './model/provider';
