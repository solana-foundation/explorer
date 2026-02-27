import type { ParsedInstruction, ParsedTransactionWithMeta, PartiallyDecodedInstruction } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';
import { validate } from 'superstruct';

import type { TokenInfo } from '../api/get-token-info';
import { extractMemoFromTransaction } from './memo';
import { TokenTransferPayload } from './schemas';
import { isParsedInstruction, type ReceiptToken } from './types';

type TokenTransferParsed =
    | {
          type: 'transferChecked';
          info: {
              source?: string;
              destination?: string;
              authority?: string;
              mint?: string;
              tokenAmount?: {
                  uiAmountString?: string | null;
                  amount?: string;
                  decimals?: number;
              };
          };
      }
    | {
          type: 'transfer2';
          info: {
              source?: string;
              destination?: string;
              authority?: string;
              mint?: string;
              tokenAmount?: {
                  uiAmountString?: string | null;
                  amount?: string;
                  decimals?: number;
              };
          };
      }
    | {
          type: 'transfer';
          info: {
              amount?: string;
              source?: string;
              destination?: string;
              authority?: string;
          };
      };

type TokenTransferInstruction = ParsedInstruction & { parsed: TokenTransferParsed };

type MultisigTransferInfo = {
    multisigAuthority: string;
};

function isMultisigTransfer(info: Record<string, unknown>): info is MultisigTransferInfo {
    return 'multisigAuthority' in info && typeof info.multisigAuthority === 'string';
}

export async function createTokenTransferReceipt(
    transaction: ParsedTransactionWithMeta,
    getTokenInfo: (mint: string | undefined) => Promise<TokenInfo | undefined>
): Promise<ReceiptToken | undefined> {
    const instruction = getSingleTokenTransferInstruction(transaction);
    if (!instruction) return undefined;

    const raw = extractTokenTransferPayload(transaction, instruction);

    const [err, validated] = validate(raw, TokenTransferPayload, { coerce: true });
    if (err) {
        console.error('Error validating token transfer payload', err);
        return undefined;
    }

    const tokenInfo = await getTokenInfo(validated.mint);
    return {
        ...validated,
        logoURI: tokenInfo?.logoURI,
        memo: raw.memo,
        symbol: tokenInfo?.symbol,
        type: 'token',
    };
}

// We support only single token transfer instruction per transaction by design.
function getSingleTokenTransferInstruction(
    transaction: ParsedTransactionWithMeta
): TokenTransferInstruction | undefined {
    const instructions = transaction.transaction.message.instructions.filter(
        (instruction): instruction is TokenTransferInstruction => isTokenTransfer(instruction)
    );
    return instructions.length === 1 ? instructions[0] : undefined;
}

function isTokenTransfer(instruction: ParsedInstruction | PartiallyDecodedInstruction): boolean {
    return (
        isTokenProgram(instruction.programId) &&
        isParsedInstruction(instruction) &&
        ['transfer', 'transferChecked', 'transfer2'].includes(instruction.parsed.type)
    );
}

function extractTokenTransferPayload(transaction: ParsedTransactionWithMeta, instruction: TokenTransferInstruction) {
    const parsed = instruction.parsed;
    return {
        date: transaction.blockTime ?? undefined,
        fee: transaction.meta?.fee,
        memo: extractMemoFromTransaction(transaction),
        mint: extractTokenMint(transaction, parsed),
        receiver: extractTokenReceiver(transaction, parsed.info.destination?.toString()),
        sender: extractTokenSender(parsed.info),
        total: extractTotal(parsed, transaction),
    };
}

function extractTokenSender(info: TokenTransferParsed['info']): string | undefined {
    if (isMultisigTransfer(info)) {
        return info.multisigAuthority;
    }
    return info.authority;
}

function extractTokenMint(transaction: ParsedTransactionWithMeta, parsed: TokenTransferParsed): string | undefined {
    if ('mint' in parsed.info) {
        return parsed.info.mint?.toString();
    }
    const destinationTokenAccount = parsed.info.destination?.toString();

    const accountIndex = transaction.transaction.message.accountKeys.findIndex(
        account => account.pubkey.toString() === destinationTokenAccount
    );

    const tokenBalance = transaction.meta?.postTokenBalances?.find(balance => balance.accountIndex === accountIndex);

    return tokenBalance?.mint;
}

function extractTokenReceiver(
    transaction: ParsedTransactionWithMeta,
    destinationTokenAccount: string | undefined
): string | undefined {
    if (!destinationTokenAccount) {
        return undefined;
    }

    const accountIndex = transaction.transaction.message.accountKeys.findIndex(
        account => account.pubkey.toString() === destinationTokenAccount
    );

    const tokenBalance = transaction.meta?.postTokenBalances?.find(balance => balance.accountIndex === accountIndex);

    return tokenBalance?.owner;
}

function extractTotal(parsed: TokenTransferParsed, transaction: ParsedTransactionWithMeta): number {
    if (parsed.type === 'transferChecked' || parsed.type === 'transfer2') {
        return parseFloat(parsed.info.tokenAmount?.uiAmountString || '0');
    }

    if (!parsed.info.amount) return 0;
    const rawAmount = parseFloat(parsed.info.amount);

    const decimals = getTokenDecimals(transaction, (parsed.info.destination || parsed.info.source)?.toString());

    if (decimals !== undefined) {
        return rawAmount / Math.pow(10, decimals);
    }

    return rawAmount;
}

function getTokenDecimals(
    transaction: ParsedTransactionWithMeta,
    tokenAccount: string | undefined
): number | undefined {
    if (!tokenAccount) {
        return undefined;
    }
    const accountIndex = transaction.transaction.message.accountKeys.findIndex(
        account => account.pubkey.toString() === tokenAccount
    );

    const tokenBalance = transaction.meta?.postTokenBalances?.find(balance => balance.accountIndex === accountIndex);

    return tokenBalance?.uiTokenAmount.decimals;
}

function isTokenProgram(programId: PublicKey): boolean {
    return (
        programId.equals(new PublicKey(TOKEN_PROGRAM_ADDRESS)) ||
        programId.equals(new PublicKey(TOKEN_2022_PROGRAM_ADDRESS))
    );
}
