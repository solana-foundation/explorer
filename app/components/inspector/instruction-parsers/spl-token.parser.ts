import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
    identifyTokenInstruction,
    parseTransferCheckedInstruction,
    parseTransferInstruction,
    TokenInstruction,
} from '@solana-program/token';

import { ITransactionInstructionParser, upcastTransactionInstruction } from '@/app/utils/parsed-tx';

type CreateAccountData = { stackHeight: number };
type TAdditionalParsedData = CreateAccountData | object;

function parsedTransferDataIntoAccountInfo(data: ReturnType<typeof parseTransferInstruction>) {
    type AccountKey = keyof typeof data.accounts;
    type ParsedInfo = {
        [K in AccountKey]: PublicKey;
    };
    const accountInfos = Object.keys(data.accounts).reduce<ParsedInfo>(
        (accounts, accountKey) => {
            const address = data.accounts[accountKey as AccountKey];
            accounts[accountKey as AccountKey] = new PublicKey(address.address);
            return accounts;
        },
        {} as ParsedInfo
    );

    return accountInfos;
}

/**
 * Parser for SPL Token Program instructions.
 *
 * Implements ITransactionInstructionParser interface to convert raw TransactionInstruction
 * into parsed format compatible with TokenDetailsCard rendering.
 *
 * Currently supports:
 * - Transfer
 * - TransferChecked
 */
export const parseSPLTokenInstruction: ITransactionInstructionParser<TAdditionalParsedData> = (ti, data) => {
    const PROGRAM_NAME = 'spl-token';
    const instructionType = identifyTokenInstruction(ti.data);

    const pre = {
        parsed: {},
        program: '',
        programId: ti.programId,
    };

    switch (instructionType) {
        case TokenInstruction.Transfer: {
            pre.program = PROGRAM_NAME;
            const parsedData = parseTransferInstruction(upcastTransactionInstruction(ti));

            // transform data to satisfy IX_STRUCTS
            const info = {
                ...parsedTransferDataIntoAccountInfo(parsedData),
                amount: parsedData.data.amount.toString(),
            };

            pre.parsed = {
                info,
                type: 'transfer',
            };
            break;
        }
        case TokenInstruction.TransferChecked: {
            pre.program = PROGRAM_NAME;
            const parsedData = parseTransferCheckedInstruction(upcastTransactionInstruction(ti));

            // transform data to satisfy IX_STRUCTS
            const info = {
                ...parsedTransferDataIntoAccountInfo(parsedData),
                amount: parsedData.data.amount.toString(),
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

/**
 * Alternative parser that returns simplified format matching other inspector parsers.
 * Returns { type: string; info: any } | null format.
 */
export function parseTokenProgramInstruction(
    instruction: TransactionInstruction
): { type: string; info: any } | null {
    const { data } = instruction;

    try {
        const instructionType = identifyTokenInstruction(data);

        switch (instructionType) {
            case TokenInstruction.Transfer: {
                const parsed = parseTransferInstruction(upcastTransactionInstruction(instruction));
                const info = {
                    ...parsedTransferDataIntoAccountInfo(parsed),
                    amount: parsed.data.amount.toString(),
                };
                return {
                    info,
                    type: 'transfer',
                };
            }
            case TokenInstruction.TransferChecked: {
                const parsed = parseTransferCheckedInstruction(upcastTransactionInstruction(instruction));
                const info = {
                    ...parsedTransferDataIntoAccountInfo(parsed),
                    amount: parsed.data.amount.toString(),
                };
                return {
                    info,
                    type: 'transferChecked',
                };
            }
            default: {
                return null;
            }
        }
    } catch {
        return null;
    }
}
