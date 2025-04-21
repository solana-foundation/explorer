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
