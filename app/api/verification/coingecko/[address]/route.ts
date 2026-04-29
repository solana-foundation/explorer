import { PublicKey } from '@solana/web3.js';
import { NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { is, number, type } from 'superstruct';

import { CoinGeckoInfoSchema } from '@/app/features/token-verification-badge/server';
import { Logger } from '@/app/shared/lib/logger';

import { CACHE_HEADERS, NO_STORE_HEADERS } from '../../config';

const COINGECKO_QUERY = [
    'community_data=false',
    'developer_data=false',
    'localization=false',
    'market_data=true',
    'sparkline=false',
    'tickers=false',
].join('&');

// Some tokens are listed on CoinGecko but have no trade data yet — upstream
// returns 200 with empty currency maps and last_updated: null. This pre-check
// catches that case so we can return 404 (a cacheable miss) instead of letting
// it fall through as a spurious schema failure.
const HasUsdMarketDataSchema = type({
    market_data: type({ current_price: type({ usd: number() }) }),
});

type Params = {
    params: {
        address: string;
    };
};

export async function GET(_request: Request, { params: { address } }: Params) {
    try {
        new PublicKey(address);
    } catch {
        return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }

    const { baseUrl, headers } = getCoingeckoConfig();

    try {
        const response = await fetch(`${baseUrl}/coins/solana/contract/${address}?${COINGECKO_QUERY}`, {
            headers,
        });

        if (!response.ok) {
            if (response.status === 429) {
                Logger.warn('[api:coingecko] Rate limit exceeded', { sentry: true });
            } else if (response.status === 404) {
                Logger.warn('[api:coingecko] No data found', { address });
            } else {
                Logger.panic(new Error(`Coingecko contract API error: ${response.status}`));
            }
            return NextResponse.json(
                { error: 'Failed to fetch coingecko data' },
                { headers: NO_STORE_HEADERS, status: response.status },
            );
        }

        const data = await response.json();

        if (!is(data, HasUsdMarketDataSchema)) {
            Logger.warn('[api:coingecko] No market data', { address });
            return NextResponse.json({ error: 'No market data' }, { headers: NO_STORE_HEADERS, status: 404 });
        }

        if (!is(data, CoinGeckoInfoSchema)) {
            Logger.warn('[api:coingecko] Invalid response schema', { address, sentry: true });
            return NextResponse.json(
                { error: 'Invalid response from coingecko API' },
                { headers: NO_STORE_HEADERS, status: 502 },
            );
        }

        return NextResponse.json(
            {
                last_updated: data.last_updated,
                market_cap_rank: data.market_cap_rank,
                market_data: {
                    current_price: { usd: data.market_data.current_price.usd },
                    market_cap: { usd: data.market_data.market_cap.usd },
                    price_change_percentage_24h_in_currency: {
                        usd: data.market_data.price_change_percentage_24h_in_currency?.usd,
                    },
                    total_volume: { usd: data.market_data.total_volume.usd },
                },
            },
            { headers: CACHE_HEADERS },
        );
    } catch (error) {
        Logger.panic(error instanceof Error ? error : new Error('Failed to fetch coingecko data'));
        return NextResponse.json(
            { error: 'Failed to fetch coingecko data' },
            { headers: NO_STORE_HEADERS, status: 500 },
        );
    }
}

function getCoingeckoConfig() {
    const apiKey = process.env.COINGECKO_API_KEY;
    const baseUrl = apiKey ? 'https://pro-api.coingecko.com/api/v3' : 'https://api.coingecko.com/api/v3';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['x-cg-pro-api-key'] = apiKey;
    return { baseUrl, headers };
}
