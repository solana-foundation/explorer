import { nullable, number, optional, string, type } from 'superstruct';

// https://docs.coingecko.com/reference/coins-contract-address
export const CoinGeckoInfoSchema = type({
    last_updated: string(),
    market_cap_rank: nullable(number()),
    market_data: type({
        current_price: type({ usd: number() }),
        market_cap: type({ usd: number() }),
        price_change_percentage_24h_in_currency: optional(type({ usd: optional(number()) })),
        total_volume: type({ usd: number() }),
    }),
});
