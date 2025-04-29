import { LoadingCard } from '@components/shared/LoadingCard';
import { CoinGeckoResult, CoingeckoStatus, CoinInfo } from '@utils/coingecko';
import { useRef } from 'react';

import { FullLegacyTokenInfo, FullTokenInfo } from '@/app/utils/token-info';

import { MarketData } from './token-market-data/MarketData';

export function TokenMarketData({
    coinInfo,
    tokenInfo,
}: {
    coinInfo?: CoinGeckoResult;
    tokenInfo?: FullTokenInfo | FullLegacyTokenInfo;
}) {
    const tokenPriceInfo = useRef<CoinInfo | undefined>(undefined);
    const tokenPriceDecimals = useRef<number>(2);

    if (coinInfo?.status === CoingeckoStatus.Success) {
        tokenPriceInfo.current = coinInfo.coinInfo;
        if (tokenPriceInfo.current && tokenPriceInfo.current.price < 1) {
            tokenPriceDecimals.current = 6;
        }
    }

    const isLoadingFromCoingecko =
        Boolean(tokenInfo?.extensions?.coingeckoId) && coinInfo?.status === CoingeckoStatus.Loading;

    return (
        <>
            {isLoadingFromCoingecko && (
                <LoadingCard className="e-mb-0 e-px-3 e-py-4" message="Loading token price data" />
            )}
            {!isLoadingFromCoingecko && tokenPriceInfo.current && (
                <MarketData.Series
                    data={[
                        {
                            label: 'Price',
                            rank: tokenPriceInfo.current.market_cap_rank,
                            value: {
                                precision: tokenPriceDecimals.current,
                                price: tokenPriceInfo.current.price,
                                trend: tokenPriceInfo.current.price_change_percentage_24h,
                            },
                        },
                        {
                            label: '24 Hour Volume',
                            value: {
                                volume: tokenPriceInfo.current.volume_24,
                            },
                        },
                        {
                            label: 'Market Cap',
                            lastUpdatedAt: tokenPriceInfo.current.last_updated,
                            value: { volume: tokenPriceInfo.current.market_cap },
                        },
                    ]}
                />
            )}
        </>
    );
}
