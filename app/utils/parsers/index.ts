import { identifySystemInstruction, parseTransferSolInstruction,SystemInstruction } from '@solana-program/system';

import { ITransactionInstructionParser, upcastTransactionInstruction } from '../parsed-tx';

type CreateAccountData = { stackHeight: number }
type TAdditionalParsedData = CreateAccountData | object

export const systemProgramTransactionInstructionParser: ITransactionInstructionParser<TAdditionalParsedData> = (ti, data) => {
    const PROGRAM_NAME = 'system';
    const instructionType = identifySystemInstruction(ti.data);

    const pre = {
        parsed: {},
        program: '',
        programId: ti.programId
    };

    switch (instructionType) {
        case SystemInstruction.TransferSol: {
            pre.program = PROGRAM_NAME;
            const data = parseTransferSolInstruction(upcastTransactionInstruction(ti));
            pre.parsed = {
                info: data,
                type: 'transfer',
            };
            break;
        }
        default: {
            // do nothing if cannot parse
        }
    }

    // enrich parsed data with external one as several instructions contains additional data
    const parsed = {
        ...pre,
        ...(data ?? {})
    };

    return parsed;
};
