import { nullable, number, optional, string, type } from 'superstruct';

// https://docs.coingecko.com/reference/coins-contract-address
// market_cap / total_volume are optional: some tokens expose a price but not
// full market data. last_updated may be null when there is no trade data.
export const CoinGeckoMarketDataSchema = type({
    last_updated: nullable(string()),
    market_cap_rank: nullable(number()),
    market_data: type({
        current_price: type({ usd: number() }),
        market_cap: optional(type({ usd: optional(number()) })),
        price_change_percentage_24h_in_currency: optional(type({ usd: optional(number()) })),
        total_volume: optional(type({ usd: optional(number()) })),
    }),
});

// Some tokens are listed on CoinGecko but have no trade data yet — upstream
// returns 200 with empty currency maps (current_price: {}, market_cap: {},
// total_volume: {}) and last_updated: null. This pre-check requires a USD price;
// without one we return a cacheable 404 (no cards) — verification is unaffected.
export const HasUsdMarketDataSchema = type({
    market_data: type({ current_price: type({ usd: number() }) }),
});
