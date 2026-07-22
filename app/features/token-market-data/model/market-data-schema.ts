import { nullable, number, optional, string, type } from 'superstruct';

// Normalized response schema
// Optional/nullable everywhere except price so partial market data validates.
export const TokenMarketDataSchema = type({
    lastUpdated: nullable(string()),
    marketCap: optional(number()),
    marketCapRank: nullable(number()),
    price: number(),
    priceChange24h: optional(number()),
    volume24h: optional(number()),
});
