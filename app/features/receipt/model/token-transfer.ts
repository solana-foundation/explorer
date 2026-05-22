import {
    collectTransferInstructions,
    isTokenTransferInstruction,
    type TokenTransferInstruction,
    type TokenTransferParsed,
} from '@entities/transfer-instruction';
import type { ParsedTransactionWithMeta } from '@solana/web3.js';
import { validate } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';

import type { TokenInfo } from '../api/get-token-info';
import { extractMemoFromTransaction } from './memo';
import { TokenTransferPayload } from './schemas';
import { type ReceiptToken, type Transfer } from './types';

type MultisigTransferInfo = {
    multisigAuthority: string;
};

function isMultisigTransfer(info: Record<string, unknown>): info is MultisigTransferInfo {
    return 'multisigAuthority' in info && typeof info.multisigAuthority === 'string';
}

export type TokenReceiptOutcome =
    | { kind: 'ok'; receipt: ReceiptToken }
    | { kind: 'rejected'; reason: 'mixed-mint' }
    | { kind: 'not-applicable' };

export async function createTokenTransferReceipt(
    transaction: ParsedTransactionWithMeta,
    getTokenInfo: (mint: string | undefined) => Promise<TokenInfo | undefined>,
): Promise<TokenReceiptOutcome> {
    const instructions = getTokenTransferInstructions(transaction);
    if (instructions.length === 0) return { kind: 'not-applicable' };

    const primary = instructions[0];
    const raw = extractTokenTransferPayload(transaction, primary);

    const [err, validated] = validate(raw, TokenTransferPayload, { coerce: true });
    if (err) {
        Logger.error(err, { instructionIndex: 0 });
        return { kind: 'not-applicable' };
    }

    let transfers: Transfer[] | undefined;
    let total = validated.total;

    if (instructions.length > 1) {
        const primaryAmount = extractAmountInfo(primary.parsed, transaction);
        if (!primaryAmount) return { kind: 'not-applicable' };

        const built = buildTokenTransfers(transaction, instructions, {
            amount: primaryAmount,
            transfer: { receiver: validated.receiver, sender: validated.sender, total: validated.total },
            validated,
        });
        if (built.kind !== 'ok') return built;
        transfers = built.transfers;
        total = built.total;
    }

    const tokenInfo = await getTokenInfo(validated.mint);
    return {
        kind: 'ok',
        receipt: {
            ...validated,
            logoURI: tokenInfo?.logoURI,
            memo: raw.memo,
            symbol: tokenInfo?.symbol,
            total,
            transfers,
            type: 'token',
        },
    };
}

function getTokenTransferInstructions(transaction: ParsedTransactionWithMeta): TokenTransferInstruction[] {
    return collectTransferInstructions(transaction, isTokenTransferInstruction);
}

type BuildTokenTransfersResult =
    | { kind: 'ok'; transfers: Transfer[] | undefined; total: number }
    | { kind: 'rejected'; reason: 'mixed-mint' }
    | { kind: 'not-applicable' };

type AmountInfo = { rawAmount: string; decimals: number };

type PrimaryToken = {
    amount: AmountInfo;
    transfer: Transfer;
    validated: { mint: string };
};

// Sums token amounts via BigInt over base units to avoid float drift (e.g. 0.1 + 0.2),
// then divides by 10^decimals once. Caller guarantees all instructions share a mint
// (and therefore the same decimals).
function buildTokenTransfers(
    transaction: ParsedTransactionWithMeta,
    instructions: TokenTransferInstruction[],
    primary: PrimaryToken,
): BuildTokenTransfersResult {
    const transfers: Transfer[] = [primary.transfer];
    let totalRaw = BigInt(primary.amount.rawAmount);
    const decimals = primary.amount.decimals;

    for (let i = 1; i < instructions.length; i++) {
        const instr = instructions[i];
        const payload = extractTokenTransferPayload(transaction, instr);
        const [err, v] = validate(payload, TokenTransferPayload, { coerce: true });
        if (err) {
            Logger.error(err, { instructionIndex: i });
            return { kind: 'not-applicable' };
        }
        // Mixed-mint receipts are out of scope: a single total only makes sense for one mint.
        if (v.mint !== primary.validated.mint) return { kind: 'rejected', reason: 'mixed-mint' };

        const amount = extractAmountInfo(instr.parsed, transaction);
        if (!amount) return { kind: 'not-applicable' };

        totalRaw += BigInt(amount.rawAmount);
        transfers.push({ receiver: v.receiver, sender: v.sender, total: v.total });
    }

    // Number() before division is intentional: BigInt division truncates (floor), which
    // would discard the fractional part. Converting first keeps the fractional digits intact.
    // Transaction token amounts are well within Number.MAX_SAFE_INTEGER for any realistic token.
    return {
        kind: 'ok',
        total: Number(totalRaw) / Math.pow(10, decimals),
        transfers: transfers.length >= 2 ? transfers : undefined,
    };
}

function extractAmountInfo(
    parsed: TokenTransferParsed,
    transaction: ParsedTransactionWithMeta,
): AmountInfo | undefined {
    if (parsed.type === 'transferChecked' || parsed.type === 'transfer2') {
        const tokenAmount = parsed.info.tokenAmount;
        if (!tokenAmount?.amount || tokenAmount.decimals === undefined) return undefined;
        return { decimals: tokenAmount.decimals, rawAmount: tokenAmount.amount };
    }
    if (!parsed.info.amount) return undefined;
    const decimals = getTokenDecimals(transaction, (parsed.info.destination || parsed.info.source)?.toString());
    if (decimals === undefined) return undefined;
    return { decimals, rawAmount: parsed.info.amount };
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
        account => account.pubkey.toString() === destinationTokenAccount,
    );

    const tokenBalance = transaction.meta?.postTokenBalances?.find(balance => balance.accountIndex === accountIndex);

    return tokenBalance?.mint;
}

function extractTokenReceiver(
    transaction: ParsedTransactionWithMeta,
    destinationTokenAccount: string | undefined,
): string | undefined {
    if (!destinationTokenAccount) {
        return undefined;
    }

    const accountIndex = transaction.transaction.message.accountKeys.findIndex(
        account => account.pubkey.toString() === destinationTokenAccount,
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
    tokenAccount: string | undefined,
): number | undefined {
    if (!tokenAccount) {
        return undefined;
    }
    const accountIndex = transaction.transaction.message.accountKeys.findIndex(
        account => account.pubkey.toString() === tokenAccount,
    );

    const tokenBalance = transaction.meta?.postTokenBalances?.find(balance => balance.accountIndex === accountIndex);

    return tokenBalance?.uiTokenAmount.decimals;
}
