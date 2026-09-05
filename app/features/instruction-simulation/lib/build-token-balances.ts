import { formatTokenAmount, tokenAmountToNumber } from '@entities/token-amount';
import { isTokenProgramId } from '@providers/accounts/tokens';
import type {
    AccountInfo,
    ParsedAccountData,
    ParsedMessageAccount,
    PublicKey,
    SimulatedTransactionAccountInfo,
    TokenBalance,
} from '@solana/web3.js';
import { getTokenDecoder, getTokenSize } from '@solana-program/token';

import { fromBase64 } from '@/app/shared/lib/bytes';
import { isTokenProgramAddress } from '@/app/shared/model/token-program';

import { ACCOUNT_TYPE_TOKEN } from './token-layout';

const TOKEN_ACCOUNT_SIZE = getTokenSize();
const tokenDecoder = getTokenDecoder();
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
    if (!dataBase64 || !isTokenProgramAddress(ownerProgram)) return undefined;

    const bytes = fromBase64(dataBase64);
    if (bytes.length < TOKEN_ACCOUNT_SIZE) return undefined;

    // Token-2022: accounts > 165 bytes carry a type discriminator — skip mints (1), keep accounts (2)
    if (bytes.length > TOKEN_ACCOUNT_SIZE && bytes[TOKEN_ACCOUNT_SIZE] !== ACCOUNT_TYPE_TOKEN) return undefined;

    // The decoder validates the account-state enum and throws on anything that isn't a
    // real token account — a Token-2022 multisig can reach here by passing the size and
    // discriminator filters above.
    let decoded;
    try {
        decoded = tokenDecoder.decode(bytes.subarray(0, TOKEN_ACCOUNT_SIZE));
    } catch {
        return undefined;
    }
    const { amount, mint, owner: tokenOwner } = decoded;

    const decimals = mintToDecimals[mint];
    if (decimals === undefined) return undefined;

    const amountStr = amount.toString();
    const tokenAmount = { amount, decimals };
    const uiAmountString = formatTokenAmount(tokenAmount);
    // uiAmount is a legacy numeric field — precision loss beyond Number.MAX_SAFE_INTEGER
    // is acceptable here because downstream code uses uiAmountString
    const uiAmount = tokenAmountToNumber(tokenAmount);

    return {
        accountIndex,
        mint,
        owner: tokenOwner,
        uiTokenAmount: {
            amount: amountStr,
            decimals,
            uiAmount,
            uiAmountString,
        },
    };
}
