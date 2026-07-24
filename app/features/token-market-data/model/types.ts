export enum TokenMarketDataStatus {
    Success,
    FetchFailed,
    Loading,
    RateLimited,
}

export interface TokenMarketStats {
    price: number;
    priceChange24h?: number;
    marketCap?: number;
    volume24h?: number;
    marketCapRank?: number;
    lastUpdated?: Date;
}

// Discriminated union so `stats` exists only on Success - other statuses cannot carry stats.
export type TokenMarketDataResult =
    | { status: TokenMarketDataStatus.Success; stats: TokenMarketStats }
    | {
          status: TokenMarketDataStatus.Loading | TokenMarketDataStatus.FetchFailed | TokenMarketDataStatus.RateLimited;
          stats?: never;
      };
