// Façade — the decoder moved to @explorer/parsers; slice import paths stay stable.
export {
    parseSystemInstruction,
    parseSystemRpcInstruction,
    SYSTEM_PROGRAM_LABEL,
    type SystemParsed,
} from '@explorer/parsers/programs/system';
