import type { InstructionParser } from '@entities/instruction-parser';

import {
    ADDRESS_LOOKUP_TABLE_PARSER_LABEL,
    ADDRESS_LOOKUP_TABLE_PROGRAM_ADDRESS,
    type AddressLookupTableParsed,
    parseAddressLookupTableKitInstruction,
    parseAddressLookupTableRpcInstruction,
} from './address-lookup-table-parser';

export const addressLookupTableInstructionParser: InstructionParser<AddressLookupTableParsed> = {
    fromParsed: parseAddressLookupTableRpcInstruction,
    fromTransaction: parseAddressLookupTableKitInstruction,
    programId: ADDRESS_LOOKUP_TABLE_PROGRAM_ADDRESS,
    programLabel: ADDRESS_LOOKUP_TABLE_PARSER_LABEL,
};
