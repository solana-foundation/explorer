import { PublicKey } from '@solana/web3.js';
import { identifySystemInstruction, parseTransferSolInstruction, SystemInstruction } from '@solana-program/system';
import { identifyTokenInstruction, parseTransferCheckedInstruction, parseTransferInstruction, TokenInstruction } from '@solana-program/token';

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
    return { ...pre, ...(data ?? {}) };
};

function parsedTransferDataIntoAccountInfo(data: ReturnType<typeof parseTransferInstruction>){
    type AccountKey = keyof typeof data.accounts
    type ParsedInfo = {
        [K in AccountKey]: PublicKey
    }
    const accountInfos = Object.keys(data.accounts).reduce< ParsedInfo>((accounts, accountKey) => {
        const address = (data.accounts[accountKey as AccountKey]);
        accounts[accountKey as AccountKey] = new PublicKey(address.address);
        return accounts;
    }, {} as ParsedInfo);

    return accountInfos;
}

export const tokenProgramTransactionInstructionParser: ITransactionInstructionParser<TAdditionalParsedData> = (ti, data) => {
    const PROGRAM_NAME = 'spl-token';
    const instructionType = identifyTokenInstruction(ti.data);

    const pre = {
        parsed: {},
        program: '',
        programId: ti.programId
    };

    switch (instructionType) {
        case TokenInstruction.Transfer: {
            pre.program = PROGRAM_NAME;
            const data = parseTransferInstruction(upcastTransactionInstruction(ti));

            // transform data to satisfy IX_STRUCTS
            const info = {
                ...parsedTransferDataIntoAccountInfo(data),
                amount: data.data.amount.toString()
            };

            pre.parsed = {
                info,
                type: 'transfer',
            };
            break;
        }
        case TokenInstruction.TransferChecked: {
            pre.program = PROGRAM_NAME;
            const data = parseTransferCheckedInstruction(upcastTransactionInstruction(ti));

            // transform data to satisfy IX_STRUCTS
            const info = {
                ...parsedTransferDataIntoAccountInfo(data),
                amount: data.data.amount.toString()
            };

            pre.parsed = {
                info,
                type: 'transferChecked',
            };
            break;
        }
        default: {
            // do nothing if cannot parse
        }
    }
    // enrich parsed data with external one as several instructions contains additional data
    return { ...pre, ...(data ?? {}) };
};
