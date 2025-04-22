import { LoadingCard } from '@components/common/LoadingCard';
import { CoinGeckoResult, CoingeckoStatus, CoinInfo } from '@utils/coingecko';
import { displayTimestampWithoutDate } from '@utils/date';
import { abbreviatedNumber } from '@utils/index';
import { useRef } from 'react';

import { FullLegacyTokenInfo, FullTokenInfo } from '@/app/utils/token-info';

import { MarketData } from './token-market-data/MarketData';

export function TokenMarketData2({
    coinInfo,
    tokenInfo,
}: {
    coinInfo?: CoinGeckoResult;
    tokenInfo?: FullTokenInfo | FullLegacyTokenInfo;
}) {
    const tokenPriceInfo = useRef<CoinInfo | undefined>(undefined);
    const tokenPriceDecimals = useRef<number>(2);

    if (coinInfo?.status === CoingeckoStatus.Success) {
        // result will be rendered on the next tick of polling
        tokenPriceInfo.current = coinInfo.coinInfo;
        if (tokenPriceInfo.current && tokenPriceInfo.current.price < 1) {
            tokenPriceDecimals.current = 6;
        }
    }

    const isLoadingFromCoingecko =
        Boolean(tokenInfo?.extensions?.coingeckoId) && coinInfo?.status === CoingeckoStatus.Loading;

    return (
        <>
            {isLoadingFromCoingecko && <LoadingCard message="Loading token price data" />}
            {tokenPriceInfo.current && (
                <>
                    <MarketData.Series
                        data={[
                            {
                                dynamic: tokenPriceInfo.current.price_change_percentage_24h,
                                label: 'Price',
                                rank: tokenPriceInfo.current.market_cap_rank,
                                value: tokenPriceInfo.current.price,
                            },
                            {
                                label: '24 Hour Volume',
                                value: tokenPriceInfo.current.volume_24h,
                            },
                            {
                                label: 'Market Cap',
                                value: tokenPriceInfo.current.market_cap,
                            },
                        ]}
                    />
                    <div className="row">
                        <div className="col-12 col-lg-4 col-xl">
                            <div className="card">
                                <div className="card-body">
                                    <h4>
                                        Price{' '}
                                        {tokenPriceInfo.current.market_cap_rank && (
                                            <span className="ms-2 badge bg-primary rank">
                                                Rank #{tokenPriceInfo.current.market_cap_rank}
                                            </span>
                                        )}
                                    </h4>
                                    <h1 className="mb-0">
                                        ${tokenPriceInfo.current.price.toFixed(tokenPriceDecimals.current)}{' '}
                                        {tokenPriceInfo.current.price_change_percentage_24h > 0 && (
                                            <small className="change-positive">
                                                &uarr; {tokenPriceInfo.current.price_change_percentage_24h.toFixed(2)}%
                                            </small>
                                        )}
                                        {tokenPriceInfo.current.price_change_percentage_24h < 0 && (
                                            <small className="change-negative">
                                                &darr; {tokenPriceInfo.current.price_change_percentage_24h.toFixed(2)}%
                                            </small>
                                        )}
                                        {tokenPriceInfo.current.price_change_percentage_24h === 0 && <small>0%</small>}
                                    </h1>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-lg-4 col-xl">
                            <div className="card">
                                <div className="card-body">
                                    <h4>24 Hour Volume</h4>
                                    <h1 className="mb-0">${abbreviatedNumber(tokenPriceInfo.current.volume_24)}</h1>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-lg-4 col-xl">
                            <div className="card">
                                <div className="card-body">
                                    <h4>Market Cap</h4>
                                    <h1 className="mb-0">${abbreviatedNumber(tokenPriceInfo.current.market_cap)}</h1>
                                    <p className="updated-time text-muted">
                                        Updated at{' '}
                                        {displayTimestampWithoutDate(tokenPriceInfo.current.last_updated.getTime())}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

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
        // result will be rendered on the next tick of polling
        tokenPriceInfo.current = coinInfo.coinInfo;
        if (tokenPriceInfo.current && tokenPriceInfo.current.price < 1) {
            tokenPriceDecimals.current = 6;
        }
    }

    return (
        <>
            {tokenInfo?.extensions?.coingeckoId && coinInfo?.status === CoingeckoStatus.Loading && (
                <LoadingCard message="Loading token price data" />
            )}
            {tokenPriceInfo.current && tokenPriceInfo.current.price && (
                <div className="row">
                    <div className="col-12 col-lg-4 col-xl">
                        <div className="card">
                            <div className="card-body">
                                <h4>
                                    Price{' '}
                                    {tokenPriceInfo.current.market_cap_rank && (
                                        <span className="ms-2 badge bg-primary rank">
                                            Rank #{tokenPriceInfo.current.market_cap_rank}
                                        </span>
                                    )}
                                </h4>
                                <h1 className="mb-0">
                                    ${tokenPriceInfo.current.price.toFixed(tokenPriceDecimals.current)}{' '}
                                    {tokenPriceInfo.current.price_change_percentage_24h > 0 && (
                                        <small className="change-positive">
                                            &uarr; {tokenPriceInfo.current.price_change_percentage_24h.toFixed(2)}%
                                        </small>
                                    )}
                                    {tokenPriceInfo.current.price_change_percentage_24h < 0 && (
                                        <small className="change-negative">
                                            &darr; {tokenPriceInfo.current.price_change_percentage_24h.toFixed(2)}%
                                        </small>
                                    )}
                                    {tokenPriceInfo.current.price_change_percentage_24h === 0 && <small>0%</small>}
                                </h1>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-lg-4 col-xl">
                        <div className="card">
                            <div className="card-body">
                                <h4>24 Hour Volume</h4>
                                <h1 className="mb-0">${abbreviatedNumber(tokenPriceInfo.current.volume_24)}</h1>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-lg-4 col-xl">
                        <div className="card">
                            <div className="card-body">
                                <h4>Market Cap</h4>
                                <h1 className="mb-0">${abbreviatedNumber(tokenPriceInfo.current.market_cap)}</h1>
                                <p className="updated-time text-muted">
                                    Updated at{' '}
                                    {displayTimestampWithoutDate(tokenPriceInfo.current.last_updated.getTime())}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
