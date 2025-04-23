import { Account } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import { CoinInfo } from '@utils/coingecko';
import { FullTokenInfo } from '@utils/token-info';

export const coinInfo = (): CoinInfo => {
    return {
        last_updated: new Date(),
        market_cap: 60882034328,
        market_cap_rank: 7,
        price: 0.999908,
        price_change_percentage_24h: 0.00051,
        volume_24: 3613399003,
    };
};

export const tokenInfo = (): FullTokenInfo => {
    return {
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        chainId: 101,
        decimals: 6,
        extensions: {
            coingeckoId: 'usd-coin',
            serumV3Usdt: '77quYg4MGneUdjgXCunt9GgM1usmrxKY31twEy3WHwcS',
            website: 'https://www.centre.io/',
        },
        logoURI:
            'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
        name: 'USD Coin',
        symbol: 'USDC',
        tags: ['community', 'strict', 'verified', 'jupiter'],
        verified: true,
    };
};

export const account = (): Account => {
    return {
        data: {
            parsed: {
                nftData: {
                    editionInfo: {},
                    metadata: {
                        data: {
                            // @ts-expect-error This is real data that is received
                            creators: undefined,
                            name: 'USD Coin',
                            sellerFeeBasisPoints: 0,
                            symbol: 'USDC',
                            uri: '',
                        },
                        editionNonce: 252,
                        // @ts-expect-error This is real data that is received
                        isMutable: 1,
                        key: 4,
                        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                        // @ts-expect-error This is real data that is received
                        primarySaleHappened: 0,
                        updateAuthority: '2wmVCSfPxGPjrnMMn7rchp4uaeoTqN39mXFC2zhPdri9',
                    },
                },
                parsed: {
                    info: {
                        decimals: 6,
                        freezeAuthority: '7dGbd2QZcCKcTndnHcTL8q7SMVXAkp688NTQYwrRCrar',
                        isInitialized: true,
                        mintAuthority: 'BJE5MMbqXjVwjAF7oxwPYXnTXDyspzZyt4vwenNw5ruG',
                        supply: '10224702067599736',
                    },
                    type: 'mint',
                },
                program: 'spl-token',
            },
        },
        executable: false,
        lamports: 389138366075,
        owner: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        pubkey: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        space: 82,
    };
};
