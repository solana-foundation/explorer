import { formatTokenAmount, tokenAmountToNumber } from '@entities/token-amount';
import { isTokenProgramId } from '@providers/accounts/tokens';
import { AccountLayout } from '@solana/spl-token';
import {
    type AccountInfo,
    type ParsedAccountData,
    type ParsedMessageAccount,
    PublicKey,
    type SimulatedTransactionAccountInfo,
    type TokenBalance,
} from '@solana/web3.js';
import { getTokenSize } from '@solana-program/token';

import { fromBase64, readU64LE, toBuffer } from '@/app/shared/lib/bytes';
import { isTokenProgram } from '@/app/shared/model/token-program';

import { ACCOUNT_TYPE_TOKEN } from './token-layout';

const TOKEN_ACCOUNT_SIZE = getTokenSize();
import { toParsedData } from './token-program';
import type { MintDecimalsMap } from './types';

export type TokenBalanceData = {
    preTokenBalances: TokenBalance[];
    postTokenBalances: TokenBalance[];
    /**
     * Parallel array of every account key in the transaction.
     * `generateTokenBalanceRows` joins token balances to addresses via `accountIndex`.
     */
    accountKeys: ParsedMessageAccount[];
};

/**
 * Build pre- and post-simulation token balance arrays.
 *
 * Pre-simulation balances come from the RPC's parsed account format (already decoded).
 * Post-simulation balances are decoded from raw base64 buffers returned by
 * `simulateTransaction`, using `mintToDecimals` to format human-readable amounts.
 */
export function buildTokenBalances(
    accountKeys: PublicKey[],
    parsedAccountsPre: (AccountInfo<ParsedAccountData | Buffer> | undefined)[],
    simulatedAccounts: (SimulatedTransactionAccountInfo | undefined)[],
    mintToDecimals: MintDecimalsMap,
): TokenBalanceData {
    const preTokenBalances: TokenBalance[] = [];
    const postTokenBalances: TokenBalance[] = [];
    const messageAccounts: ParsedMessageAccount[] = [];

    for (let index = 0; index < accountKeys.length; index++) {
        const preBalance = extractPreTokenBalance(index, parsedAccountsPre[index]);
        if (preBalance) preTokenBalances.push(preBalance);

        const postBalance = extractPostTokenBalance(index, simulatedAccounts.at(index), mintToDecimals);
        if (postBalance) postTokenBalances.push(postBalance);

        // Every key must be present so generateTokenBalanceRows can join by accountIndex
        messageAccounts.push({ pubkey: accountKeys[index], signer: false, writable: true });
    }

    return { accountKeys: messageAccounts, postTokenBalances, preTokenBalances };
}

function extractPreTokenBalance(
    accountIndex: number,
    account: AccountInfo<ParsedAccountData | Buffer> | undefined,
): TokenBalance | undefined {
    if (!account || !isTokenProgramId(account.owner)) return undefined;

    const parsed = toParsedData(account.data);
    if (!parsed || parsed.parsed.type !== 'account') return undefined;

    const { mint, owner, tokenAmount } = parsed.parsed.info;
    return { accountIndex, mint, owner, uiTokenAmount: tokenAmount };
}

function extractPostTokenBalance(
    accountIndex: number,
    accountInfo: SimulatedTransactionAccountInfo | undefined,
    mintToDecimals: MintDecimalsMap,
): TokenBalance | undefined {
    if (!accountInfo) return undefined;

    const dataBase64 = accountInfo.data[0];
    const ownerProgram = accountInfo.owner;
    if (!dataBase64 || !isTokenProgram(ownerProgram)) return undefined;

    const bytes = fromBase64(dataBase64);
    if (bytes.length < TOKEN_ACCOUNT_SIZE) return undefined;

    // Token-2022: accounts > 165 bytes carry a type discriminator — skip mints (1), keep accounts (2)
    if (bytes.length > TOKEN_ACCOUNT_SIZE && bytes[TOKEN_ACCOUNT_SIZE] !== ACCOUNT_TYPE_TOKEN) return undefined;

    // AccountLayout.decode uses @solana/buffer-layout which requires Buffer
    const decoded = AccountLayout.decode(toBuffer(bytes));
    const mint = new PublicKey(decoded.mint);
    const tokenOwner = new PublicKey(decoded.owner);
    const rawAmount = readU64LE(decoded.amount, 0);

    const decimals = mintToDecimals[mint.toBase58()];
    if (decimals === undefined) return undefined;

    const amountStr = rawAmount.toString();
    const tokenAmount = { amount: rawAmount, decimals };
    const uiAmountString = formatTokenAmount(tokenAmount);
    // uiAmount is a legacy numeric field — precision loss beyond Number.MAX_SAFE_INTEGER
    // is acceptable here because downstream code uses uiAmountString
    const uiAmount = tokenAmountToNumber(tokenAmount);

    return {
        accountIndex,
        mint: mint.toBase58(),
        owner: tokenOwner.toBase58(),
        uiTokenAmount: {
            amount: amountStr,
            decimals,
            uiAmount,
            uiAmountString,
        },
    };
}
