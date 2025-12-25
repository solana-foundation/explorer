import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
    identifyTokenInstruction,
    parseSyncNativeInstruction,
    parseTransferCheckedInstruction,
    parseTransferInstruction,
    TokenInstruction,
} from '@solana-program/token';
import { normalizeTokenAmount } from '@utils/index';

import { upcastTransactionInstruction } from '../into-parsed-data';

function parsedTransferDataIntoAccountInfo(data: ReturnType<typeof parseTransferInstruction>) {
    type AccountKey = keyof typeof data.accounts;
    type ParsedInfo = {
        [K in AccountKey]: PublicKey;
    };
    const accountInfos = Object.keys(data.accounts).reduce<ParsedInfo>((accounts, accountKey) => {
        const address = data.accounts[accountKey as AccountKey];
        accounts[accountKey as AccountKey] = new PublicKey(address.address);
        return accounts;
    }, {} as ParsedInfo);

    return accountInfos;
}

/**
 * Parser for SPL Token Program instructions.
 * Returns { type: string; info: any } | null format.
 */
export function parseTokenProgramInstruction(instruction: TransactionInstruction): { type: string; info: any } | null {
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
                const amount = parsed.data.amount.toString();
                const decimals = parsed.data.decimals;
                const info = {
                    ...parsedTransferDataIntoAccountInfo(parsed),
                    tokenAmount: {
                        amount,
                        decimals,
                        uiAmountString: normalizeTokenAmount(amount, decimals).toString(),
                    },
                };
                return {
                    info,
                    type: 'transferChecked',
                };
            }
            case TokenInstruction.SyncNative: {
                const parsed = parseSyncNativeInstruction(upcastTransactionInstruction(instruction));
                const info = {
                    account: new PublicKey(parsed.accounts.account.address),
                };
                return {
                    info,
                    type: 'syncNative',
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
