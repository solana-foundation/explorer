import { LoadingCard } from '@components/common/LoadingCard';
import { CoingeckoStatus } from '@utils/coingecko';
import { displayTimestamp, displayTimestampWithoutDate } from '@utils/date';
import { abbreviatedNumber, normalizeTokenAmount } from '@utils/index';

export function TokenMarketData({ coinInfo, tokenInfo, tokenPriceInfo }) {
    let tokenPriceDecimals = 2;
    if (coinInfo?.status === CoingeckoStatus.Success) {
        tokenPriceInfo = coinInfo.coinInfo;
        if (tokenPriceInfo && tokenPriceInfo.price < 1) {
            tokenPriceDecimals = 6;
        }
    }

    return (
        <>
            {tokenInfo?.extensions?.coingeckoId && coinInfo?.status === CoingeckoStatus.Loading && (
                <LoadingCard message="Loading token price data" />
            )}
            {tokenPriceInfo && tokenPriceInfo.price && (
                <div className="row">
                    <div className="col-12 col-lg-4 col-xl">
                        <div className="card">
                            <div className="card-body">
                                <h4>
                                    Price{' '}
                                    {tokenPriceInfo.market_cap_rank && (
                                        <span className="ms-2 badge bg-primary rank">
                                            Rank #{tokenPriceInfo.market_cap_rank}
                                        </span>
                                    )}
                                </h4>
                                <h1 className="mb-0">
                                    ${tokenPriceInfo.price.toFixed(tokenPriceDecimals)}{' '}
                                    {tokenPriceInfo.price_change_percentage_24h > 0 && (
                                        <small className="change-positive">
                                            &uarr; {tokenPriceInfo.price_change_percentage_24h.toFixed(2)}%
                                        </small>
                                    )}
                                    {tokenPriceInfo.price_change_percentage_24h < 0 && (
                                        <small className="change-negative">
                                            &darr; {tokenPriceInfo.price_change_percentage_24h.toFixed(2)}%
                                        </small>
                                    )}
                                    {tokenPriceInfo.price_change_percentage_24h === 0 && <small>0%</small>}
                                </h1>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-lg-4 col-xl">
                        <div className="card">
                            <div className="card-body">
                                <h4>24 Hour Volume</h4>
                                <h1 className="mb-0">${abbreviatedNumber(tokenPriceInfo.volume_24)}</h1>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-lg-4 col-xl">
                        <div className="card">
                            <div className="card-body">
                                <h4>Market Cap</h4>
                                <h1 className="mb-0">${abbreviatedNumber(tokenPriceInfo.market_cap)}</h1>
                                <p className="updated-time text-muted">
                                    Updated at {displayTimestampWithoutDate(tokenPriceInfo.last_updated.getTime())}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
