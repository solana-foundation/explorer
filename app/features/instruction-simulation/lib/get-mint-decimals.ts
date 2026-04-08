import { isTokenProgramId } from '@providers/accounts/tokens';
import { MintLayout } from '@solana/spl-token';
import type { AccountInfo, ParsedAccountData, PublicKey, SimulatedTransactionAccountInfo } from '@solana/web3.js';

import { fromBase64, toBuffer } from '@/app/shared/lib/bytes';

import { ACCOUNT_TYPE_MINT, MIN_MINT_ACCOUNT_BUFFER_LENGTH, MINT_SIZE, TOKEN_ACCOUNT_SIZE } from './token-layout';
import { isTokenProgramBase58, toParsedData } from './token-program';
import type { MintDecimalsMap } from './types';

export function getMintDecimals(
    accountKeys: PublicKey[],
    // Buffer comes from the web3.js SDK return type for getMultipleParsedAccounts
    parsedAccountsPre: (AccountInfo<ParsedAccountData | Buffer> | undefined)[],
    accountDatasPost: (SimulatedTransactionAccountInfo | undefined)[],
): MintDecimalsMap {
    const mintToDecimals: MintDecimalsMap = {};

    for (let index = 0; index < accountKeys.length; index++) {
        const key = accountKeys[index];

        const preEntry = decimalsFromPreAccount(key, parsedAccountsPre[index]);
        if (preEntry) mintToDecimals[preEntry.mint] = preEntry.decimals;

        const postEntry = decimalsFromPostAccount(key, accountDatasPost.at(index));
        if (postEntry) mintToDecimals[postEntry.mint] = postEntry.decimals;
    }

    return mintToDecimals;
}

interface DecimalsEntry {
    mint: string;
    decimals: number;
}

function decimalsFromPreAccount(
    key: PublicKey,
    account: AccountInfo<ParsedAccountData | Buffer> | undefined,
): DecimalsEntry | undefined {
    if (!account || !isTokenProgramId(account.owner)) return undefined;

    const data = toParsedData(account.data);
    if (!data) return undefined;

    if (data.parsed.type === 'account') {
        return { decimals: data.parsed.info.tokenAmount.decimals, mint: data.parsed.info.mint };
    }
    if (data.parsed.type === 'mint') {
        return { decimals: data.parsed.info.decimals, mint: key.toBase58() };
    }
    return undefined;
}

function decimalsFromPostAccount(
    key: PublicKey,
    accountInfo: SimulatedTransactionAccountInfo | undefined,
): DecimalsEntry | undefined {
    const dataBase64 = accountInfo?.data[0];
    const owner = accountInfo?.owner;

    if (!owner || !dataBase64 || !isTokenProgramBase58(owner)) return undefined;

    const bytes = fromBase64(dataBase64);
    if (!isMintBuffer(bytes)) return undefined;

    // MintLayout.decode uses @solana/buffer-layout which requires Buffer
    const mint = MintLayout.decode(toBuffer(bytes.subarray(0, MIN_MINT_ACCOUNT_BUFFER_LENGTH)));
    return { decimals: mint.decimals, mint: key.toBase58() };
}

/**
 * Distinguish mint buffers from token account buffers.
 *
 * - 82 bytes: base spl-token mint
 * - 165 bytes: base spl-token token account (not a mint)
 * - >165 bytes: Token-2022 with extensions — check the account type discriminator
 */
function isMintBuffer(bytes: Uint8Array): boolean {
    if (bytes.length === MINT_SIZE) return true;
    if (bytes.length < MINT_SIZE) return false;
    if (bytes.length === TOKEN_ACCOUNT_SIZE) return false;
    // Token-2022: discriminator at offset 165 distinguishes mints from token accounts
    return bytes[TOKEN_ACCOUNT_SIZE] === ACCOUNT_TYPE_MINT;
}
