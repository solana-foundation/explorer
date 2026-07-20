import type { Infer } from 'superstruct';

import { TokenMarketDataSchema } from '../../model/market-data-schema';
import { TokenMarketStats } from '../../model/types';

const DEFAULT_MARKET_DATA = {
    lastUpdated: '2025-01-01T00:00:00Z',
    marketCap: 1_000_000,
    marketCapRank: 5,
    price: 1.23,
    priceChange24h: 0.67,
    volume24h: 500_000,
} as const;

/** Raw CoinGecko "Coins" contract-address response (upstream shape the route normalizes). */
export type CoinGeckoMarketDataOverrides = {
    last_updated?: unknown;
    market_cap_rank?: unknown;
    market_data?: unknown;
};

/**
 * Upstream CoinGecko response.
 */
export function createCoinGeckoMarketData(overrides: CoinGeckoMarketDataOverrides = {}): Record<string, unknown> {
    const { market_data, ...rest } = overrides;
    return {
        last_updated: DEFAULT_MARKET_DATA.lastUpdated,
        market_cap_rank: DEFAULT_MARKET_DATA.marketCapRank,
        market_data: market_data ?? {
            current_price: { eur: 0.92, usd: DEFAULT_MARKET_DATA.price },
            market_cap: { usd: DEFAULT_MARKET_DATA.marketCap },
            price_change_percentage_24h_in_currency: { usd: DEFAULT_MARKET_DATA.priceChange24h },
            total_volume: { usd: DEFAULT_MARKET_DATA.volume24h },
        },
        ...rest,
    };
}

type TokenMarketData = Infer<typeof TokenMarketDataSchema>;

/** Normalized wire shape the route emits and the hook fetches (matches `TokenMarketDataSchema`). */
export function createTokenMarketData(overrides: Partial<TokenMarketData> = {}): TokenMarketData {
    return { ...DEFAULT_MARKET_DATA, ...overrides };
}

/** Parsed domain stats (`lastUpdated` as a `Date`) — what the hook returns and the UI consumes. */
export function createTokenMarketStats(overrides: Partial<TokenMarketStats> = {}): TokenMarketStats {
    return {
        lastUpdated: new Date(DEFAULT_MARKET_DATA.lastUpdated),
        marketCap: DEFAULT_MARKET_DATA.marketCap,
        marketCapRank: DEFAULT_MARKET_DATA.marketCapRank,
        price: DEFAULT_MARKET_DATA.price,
        priceChange24h: DEFAULT_MARKET_DATA.priceChange24h,
        volume24h: DEFAULT_MARKET_DATA.volume24h,
        ...overrides,
    };
}
