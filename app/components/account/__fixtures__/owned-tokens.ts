import { tokenInfo } from '@entities/token-info/__fixtures__/token-info';
import type { TokenInfoWithPubkey } from '@providers/accounts/tokens';
import { FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';

export const OWNER = '11111111111111111111111111111111';
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const TOKEN_ACCOUNT = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

export function ownedTokensEntry(tokens: TokenInfoWithPubkey[]) {
    return { data: { tokens }, status: FetchStatus.Fetched };
}

export function ownedToken(
    tokenAmount: TokenInfoWithPubkey['info']['tokenAmount'],
    pubkey = TOKEN_ACCOUNT,
    mint = USDC_MINT,
): TokenInfoWithPubkey {
    return {
        info: {
            isNative: false,
            mint: new PublicKey(mint),
            owner: new PublicKey(OWNER),
            state: 'initialized',
            tokenAmount,
        },
        pubkey: new PublicKey(pubkey),
    };
}

export const USDC_HOLDING = ownedToken({ amount: '1234560000', decimals: 6, uiAmountString: '1234.56' });

export const USDC_TOKEN_INFO = tokenInfo(USDC_MINT, true, {
    logoURI:
        'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    name: 'USD Coin',
    symbol: 'USDC',
});
