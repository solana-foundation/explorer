import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@providers/accounts/tokens';
import { MintLayout } from '@solana/spl-token';
import {
    type AccountInfo,
    type ParsedAccountData,
    PublicKey,
    type SimulatedTransactionAccountInfo,
} from '@solana/web3.js';

export const MINT_ACCOUNT_BUFFER_LENGTH = 82;

export function isTokenProgramBase58(programIdBase58: string): boolean {
    return programIdBase58 === TOKEN_PROGRAM_ID.toBase58() || programIdBase58 === TOKEN_2022_PROGRAM_ID.toBase58();
}

export function getMintDecimals(
    accountKeys: PublicKey[],
    parsedAccountsPre: (AccountInfo<ParsedAccountData | Buffer> | null)[],
    accountDatasPost: SimulatedTransactionAccountInfo[]
): { [mintPk: string]: number } {
    const mintToDecimals: { [mintPk: string]: number } = {};
    // Get all the necessary mint decimals by looking at parsed token accounts
    // and mints before, as well as mints after.
    for (let index = 0; index < accountKeys.length; index++) {
        const parsedAccount = parsedAccountsPre[index];
        const key = accountKeys[index];

        // Token account before
        if (
            parsedAccount &&
            isTokenProgramBase58(parsedAccount.owner.toBase58()) &&
            (parsedAccount.data as ParsedAccountData).parsed.type === 'account'
        ) {
            mintToDecimals[(parsedAccount?.data as ParsedAccountData).parsed.info.mint] = (
                parsedAccount?.data as ParsedAccountData
            ).parsed.info.tokenAmount.decimals;
        }
        // Mint account before
        if (
            parsedAccount &&
            isTokenProgramBase58(parsedAccount.owner.toBase58()) &&
            (parsedAccount?.data as ParsedAccountData).parsed.type === 'mint'
        ) {
            mintToDecimals[key.toBase58()] = (parsedAccount?.data as ParsedAccountData).parsed.info.decimals;
        }

        // Token account after
        const accountDataPost = accountDatasPost.at(index)?.data[0];
        const accountOwnerPost = accountDatasPost.at(index)?.owner;
        if (
            accountOwnerPost &&
            isTokenProgramBase58(accountOwnerPost) &&
            Buffer.from(accountDataPost!, 'base64').length === MINT_ACCOUNT_BUFFER_LENGTH
        ) {
            const accountParsedPost = MintLayout.decode(Buffer.from(accountDataPost!, 'base64'));
            mintToDecimals[key.toBase58()] = accountParsedPost.decimals;
        }
    }

    return mintToDecimals;
}
