import { NATIVE_MINT } from '@solana/spl-token';
import type { AccountInfo, ParsedAccountData, SimulatedTransactionAccountInfo } from '@solana/web3.js';
import { Keypair, PublicKey } from '@solana/web3.js';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import { getMintSize, getTokenSize, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';

import { USDC_MINT } from '@/app/shared/model/known-mints';

const MINT_SIZE = getMintSize();
const TOKEN_ACCOUNT_SIZE = getTokenSize();

export { SYSTEM_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS, TOKEN_PROGRAM_ADDRESS, USDC_MINT };
export const WSOL_MINT = NATIVE_MINT;
export const SOME_KEY = Keypair.generate().publicKey;

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
    owner: new PublicKey(TOKEN_PROGRAM_ADDRESS),
    rentEpoch: 0,
};

/** Same token account shape but owned by Token-2022 */
export const PARSED_USDC_TOKEN_ACCOUNT_2022: AccountInfo<ParsedAccountData> = {
    ...PARSED_USDC_TOKEN_ACCOUNT,
    owner: new PublicKey(TOKEN_2022_PROGRAM_ADDRESS),
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
    owner: new PublicKey(TOKEN_PROGRAM_ADDRESS),
    rentEpoch: 0,
};

/** System-owned account with no meaningful data — stands in for accounts irrelevant to token parsing */
export const POST_SYSTEM_ACCOUNT: SimulatedTransactionAccountInfo = {
    data: ['', 'base64'],
    executable: false,
    lamports: 1_000_000,
    owner: SYSTEM_PROGRAM_ADDRESS,
    rentEpoch: 0,
};

/** Post-simulation account with given base64 data and program owner */
export function postAccount(base64Data: string, owner: string): SimulatedTransactionAccountInfo {
    return { data: [base64Data, 'base64'], executable: false, lamports: 1_000_000, owner, rentEpoch: 0 };
}
