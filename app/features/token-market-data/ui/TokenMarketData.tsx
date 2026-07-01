import { LoadingCard } from '@components/shared/LoadingCard';

import { cn } from '@/app/components/shared/utils';

import { type TokenMarketDataResult, TokenMarketDataStatus } from '../model/types';
import { MarketData, type MarketDataProps } from './MarketData';

const DEFAULT_PRICE_DECIMALS = 2;
const SUB_DOLLAR_PRICE_DECIMALS = 6;

export function TokenMarketData({ marketData }: { marketData?: TokenMarketDataResult }) {
    const stats = marketData?.status === TokenMarketDataStatus.Success ? marketData.stats : undefined;
    const priceDecimals = stats && stats.price < 1 ? SUB_DOLLAR_PRICE_DECIMALS : DEFAULT_PRICE_DECIMALS;

    const isLoading = marketData?.status === TokenMarketDataStatus.Loading;

    const tiles: MarketDataProps[] = [];
    if (stats) {
        tiles.push({
            label: 'Price',
            rank: stats.marketCapRank,
            value: {
                precision: priceDecimals,
                price: stats.price,
                trend: stats.priceChange24h,
            },
        });
        if (stats.volume24h !== undefined) {
            tiles.push({ label: '24 Hour Volume', value: { volume: stats.volume24h } });
        }
        if (stats.marketCap !== undefined) {
            tiles.push({
                label: 'Market Cap',
                lastUpdatedAt: stats.lastUpdated,
                value: { volume: stats.marketCap },
            });
        }
    }

    return (
        <>
            {isLoading && (
                <LoadingCard
                    className={cn(
                        'm-0 grid w-full place-items-center rounded border border-solid border-black bg-outer-space-900 px-2 py-1 text-sm',
                        'md:min-h-[69px]',
                    )}
                    message="Loading token price data"
                />
            )}
            {!isLoading && tiles.length > 0 && <MarketData.Series data={tiles} />}
        </>
    );
}
