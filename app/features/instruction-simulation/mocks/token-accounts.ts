import type { AccountInfo, ParsedAccountData, SimulatedTransactionAccountInfo } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';

import { MINT_SIZE, TOKEN_ACCOUNT_SIZE } from '../lib/token-layout';

export const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
export const SYSTEM_PROGRAM = '11111111111111111111111111111111';

export const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
export const WSOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
export const SOME_KEY = new PublicKey('5ZiE3vAkrdXBgyFL7KqG3RoEGBws8CjY8AsGq1MuR5My');

/** Parsed USDC token account (decimals 6, owned by TOKEN_PROGRAM) as returned by getMultipleParsedAccounts */
export const PARSED_USDC_TOKEN_ACCOUNT: AccountInfo<ParsedAccountData> = {
    data: {
        parsed: {
            info: {
                mint: USDC_MINT.toBase58(),
                owner: SOME_KEY.toBase58(),
                tokenAmount: { amount: '1000000', decimals: 6, uiAmount: 1, uiAmountString: '1' },
            },
            type: 'account',
        },
        program: 'spl-token',
        space: TOKEN_ACCOUNT_SIZE,
    },
    executable: false,
    lamports: 2_039_280,
    owner: new PublicKey(TOKEN_PROGRAM),
    rentEpoch: 0,
};

/** Same token account shape but owned by Token-2022 */
export const PARSED_USDC_TOKEN_ACCOUNT_2022: AccountInfo<ParsedAccountData> = {
    ...PARSED_USDC_TOKEN_ACCOUNT,
    owner: new PublicKey(TOKEN_2022_PROGRAM),
};

/** Parsed WSOL mint account (decimals 9) as returned by getMultipleParsedAccounts */
export const PARSED_WSOL_MINT_ACCOUNT: AccountInfo<ParsedAccountData> = {
    data: {
        parsed: {
            info: { decimals: 9, supply: '1000000000' },
            type: 'mint',
        },
        program: 'spl-token',
        space: MINT_SIZE,
    },
    executable: false,
    lamports: 1_000_000,
    owner: new PublicKey(TOKEN_PROGRAM),
    rentEpoch: 0,
};

/** System-owned account with no meaningful data — stands in for accounts irrelevant to token parsing */
export const POST_SYSTEM_ACCOUNT: SimulatedTransactionAccountInfo = {
    data: ['', 'base64'],
    executable: false,
    lamports: 1_000_000,
    owner: SYSTEM_PROGRAM,
    rentEpoch: 0,
};

/** Post-simulation account with given base64 data and program owner */
export function postAccount(base64Data: string, owner: string): SimulatedTransactionAccountInfo {
    return { data: [base64Data, 'base64'], executable: false, lamports: 1_000_000, owner, rentEpoch: 0 };
}
