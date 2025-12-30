import { TokenInstructionType } from '@components/instruction/token/types';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
    identifyTokenInstruction,
    parseCloseAccountInstruction,
    parseInitializeAccountInstruction,
    parseSyncNativeInstruction,
    parseTransferCheckedInstruction,
    parseTransferInstruction,
    TokenInstruction,
} from '@solana-program/token';
import { normalizeTokenAmount } from '@utils/index';

import { intoInstructionData } from '../into-parsed-data';

/**
 * Parser for SPL Token Program instructions.
 */
export function parseTokenProgramInstruction(
    instruction: TransactionInstruction
): { type: TokenInstructionType; info: unknown } | null {
    const { data } = instruction;

    try {
        const instructionType = identifyTokenInstruction(data);

        switch (instructionType) {
            case TokenInstruction.CloseAccount: {
                const parsed = parseCloseAccountInstruction(intoInstructionData(instruction));
                const info = {
                    account: new PublicKey(parsed.accounts.account.address),
                    destination: new PublicKey(parsed.accounts.destination.address),
                    owner: new PublicKey(parsed.accounts.owner.address),
                };
                return { info, type: 'closeAccount' };
            }
            case TokenInstruction.InitializeAccount: {
                const parsed = parseInitializeAccountInstruction(intoInstructionData(instruction));
                const info = {
                    account: new PublicKey(parsed.accounts.account.address),
                    mint: new PublicKey(parsed.accounts.mint.address),
                    owner: new PublicKey(parsed.accounts.owner.address),
                    rentSysvar: new PublicKey(parsed.accounts.rent.address),
                };
                return { info, type: 'initializeAccount' };
            }
            case TokenInstruction.SyncNative: {
                const parsed = parseSyncNativeInstruction(intoInstructionData(instruction));
                const info = {
                    account: new PublicKey(parsed.accounts.account.address),
                };
                return { info, type: 'syncNative' };
            }
            case TokenInstruction.Transfer: {
                const parsed = parseTransferInstruction(intoInstructionData(instruction));
                const info = {
                    amount: parsed.data.amount.toString(),
                    authority: new PublicKey(parsed.accounts.authority.address),
                    destination: new PublicKey(parsed.accounts.destination.address),
                    source: new PublicKey(parsed.accounts.source.address),
                };
                return { info, type: 'transfer' };
            }
            case TokenInstruction.TransferChecked: {
                const parsed = parseTransferCheckedInstruction(intoInstructionData(instruction));
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
            default: {
                return null;
            }
        }
    } catch {
        return null;
    }
}
