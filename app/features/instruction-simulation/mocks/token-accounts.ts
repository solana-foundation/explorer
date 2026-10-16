import { address, none } from '@solana/kit';
import type { AccountInfo, ParsedAccountData, SimulatedTransactionAccountInfo } from '@solana/web3.js';
import { Keypair, PublicKey } from '@solana/web3.js';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import { AccountState, getMintSize, getTokenEncoder, getTokenSize, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';

import { alloc, toBase64 } from '@/app/shared/lib/bytes';
import { USDC_MINT } from '@/app/shared/model/known-mints';
import { NATIVE_MINT_ADDRESS } from '@/app/shared/model/token-program';

import { ACCOUNT_TYPE_TOKEN } from '../lib/token-layout';

const MINT_SIZE = getMintSize();
const TOKEN_ACCOUNT_SIZE = getTokenSize();

export { SYSTEM_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS, TOKEN_PROGRAM_ADDRESS, USDC_MINT };
export const WSOL_MINT = new PublicKey(NATIVE_MINT_ADDRESS);
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

/** mintAuthorityOption(4) + mintAuthority(32) + supply(8) = 44 */
export const MINT_DECIMALS_OFFSET = 44;
/** Offset of the account-state byte: mint (32) + owner (32) + amount (8) + delegate COption<Address> (4 + 32) */
const STATE_OFFSET = 108;
const tokenEncoder = getTokenEncoder();

export function encodeTokenAccountBase64(
    mint: PublicKey,
    owner: PublicKey,
    amount: bigint,
    { state, totalSize = TOKEN_ACCOUNT_SIZE }: { state?: number; totalSize?: number } = {},
): string {
    const encoded = tokenEncoder.encode({
        amount,
        closeAuthority: none(),
        delegate: none(),
        delegatedAmount: 0n,
        isNative: none(),
        mint: address(mint.toBase58()),
        owner: address(owner.toBase58()),
        state: AccountState.Initialized,
    });

    const buf = alloc(totalSize);
    buf.set(encoded);

    // The encoder only accepts in-range AccountState values, so corrupt vectors patch the byte directly
    if (state !== undefined) buf[STATE_OFFSET] = state;
    if (totalSize > TOKEN_ACCOUNT_SIZE) buf[TOKEN_ACCOUNT_SIZE] = ACCOUNT_TYPE_TOKEN;

    return toBase64(buf);
}

export function encodeMintAccountBase64(decimals: number, size = MINT_SIZE): string {
    const bytes = new Uint8Array(size);
    bytes[MINT_DECIMALS_OFFSET] = decimals;
    bytes[MINT_DECIMALS_OFFSET + 1] = 1; // isInitialized
    return toBase64(bytes);
}
