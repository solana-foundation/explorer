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
                    amount: parsed.data.amount.toString(),
                    authority: new PublicKey(parsed.accounts.authority.address),
                    destination: new PublicKey(parsed.accounts.destination.address),
                    source: new PublicKey(parsed.accounts.source.address),
                };
                return { info, type: 'transfer' };
            }
            case TokenInstruction.TransferChecked: {
                const parsed = parseTransferCheckedInstruction(upcastTransactionInstruction(instruction));
                const amount = parsed.data.amount.toString();
                const decimals = parsed.data.decimals;
                const info = {
                    authority: new PublicKey(parsed.accounts.authority.address),
                    destination: new PublicKey(parsed.accounts.destination.address),
                    mint: new PublicKey(parsed.accounts.mint.address),
                    source: new PublicKey(parsed.accounts.source.address),
                    tokenAmount: {
                        amount,
                        decimals,
                        uiAmountString: normalizeTokenAmount(amount, decimals).toString(),
                    },
                };
                return { info, type: 'transferChecked' };
            }
            case TokenInstruction.SyncNative: {
                const parsed = parseSyncNativeInstruction(upcastTransactionInstruction(instruction));
                const info = {
                    account: new PublicKey(parsed.accounts.account.address),
                };
                return { info, type: 'syncNative' };
            }
            default: {
                return null;
            }
        }
    } catch {
        return null;
    }
}
