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

export type TokenMarketDataResult = {
    stats?: TokenMarketStats;
    status: TokenMarketDataStatus;
};
