import { CoinGeckoMarketDataSchema, HasUsdMarketDataSchema } from '@entities/coingecko/server';
import { PublicKey } from '@solana/web3.js';
import { NextResponse } from 'next/server';
import { is } from 'superstruct';

import {
    CACHE_HEADERS,
    ERROR_CACHE_HEADERS,
    fetchUpstream,
    isTimeoutError,
    NO_STORE_HEADERS,
} from '@/app/shared/lib/http-utils';
import { Logger } from '@/app/shared/lib/logger';

const COINGECKO_QUERY = [
    'community_data=false',
    'developer_data=false',
    'localization=false',
    'market_data=true',
    'sparkline=false',
    'tickers=false',
].join('&');

type Params = { params: Promise<{ address: string }> };

export async function GET(_request: Request, props: Params) {
    const { address } = await props.params;

    try {
        new PublicKey(address);
    } catch {
        return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }

    const { baseUrl, headers } = getCoingeckoConfig();

    try {
        const response = await fetchUpstream(`${baseUrl}/coins/solana/contract/${address}?${COINGECKO_QUERY}`, {
            headers,
        });

        if (!response.ok) {
            if (response.status === 429) {
                Logger.warn('[api:token-market-data] Rate limit exceeded', { sentry: true });
            } else if (response.status === 404) {
                Logger.warn('[api:token-market-data] No data found', { address });
            } else {
                Logger.panic(new Error(`CoinGecko contract API error: ${response.status}`));
            }
            return NextResponse.json(
                { error: 'Failed to fetch market data' },
                { headers: NO_STORE_HEADERS, status: response.status },
            );
        }

        let data: unknown;
        try {
            data = await response.json();
        } catch {
            Logger.warn('[api:token-market-data] Failed to parse upstream JSON', { address, sentry: true });
            return NextResponse.json(
                { error: 'Invalid response from market data provider' },
                { headers: ERROR_CACHE_HEADERS, status: 502 },
            );
        }

        if (!is(data, HasUsdMarketDataSchema)) {
            Logger.warn('[api:token-market-data] No market data', { address });
            return NextResponse.json({ error: 'No market data' }, { headers: CACHE_HEADERS, status: 404 });
        }

        if (!is(data, CoinGeckoMarketDataSchema)) {
            Logger.warn('[api:token-market-data] Invalid response schema', { address, sentry: true });
            return NextResponse.json(
                { error: 'Invalid response from market data provider' },
                { headers: ERROR_CACHE_HEADERS, status: 502 },
            );
        }

        return NextResponse.json(
            {
                lastUpdated: data.last_updated,
                marketCap: data.market_data.market_cap?.usd,
                marketCapRank: data.market_cap_rank,
                price: data.market_data.current_price.usd,
                priceChange24h: data.market_data.price_change_percentage_24h_in_currency?.usd,
                volume24h: data.market_data.total_volume?.usd,
            },
            { headers: CACHE_HEADERS },
        );
    } catch (error) {
        if (isTimeoutError(error)) {
            Logger.warn('[api:token-market-data] Upstream request timed out', { address, sentry: true });
            return NextResponse.json(
                { error: 'Upstream request timed out' },
                { headers: ERROR_CACHE_HEADERS, status: 504 },
            );
        }
        Logger.panic(error instanceof Error ? error : new Error('Failed to fetch market data'));
        return NextResponse.json({ error: 'Failed to fetch market data' }, { headers: NO_STORE_HEADERS, status: 500 });
    }
}

// Market data: CoinGecko "Coins" endpoint by contract address.
// - Docs: https://docs.coingecko.com/reference/coins-contract-address
// - GET {baseUrl}/coins/solana/contract/{address}?market_data=true
// Public host (api.coingecko.com) when no key as fallback.
function getCoingeckoConfig() {
    const apiKey = process.env.COINGECKO_API_KEY;
    const baseUrl = apiKey ? 'https://pro-api.coingecko.com/api/v3' : 'https://api.coingecko.com/api/v3';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['x-cg-pro-api-key'] = apiKey;
    return { baseUrl, headers };
}
