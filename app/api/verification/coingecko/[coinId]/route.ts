import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';
import fetch from 'node-fetch';

import Logger from '@/app/utils/logger';

import { CACHE_HEADERS, NO_STORE_HEADERS } from '../../config';

// eslint-disable-next-line no-restricted-syntax -- CoinGecko coin IDs only contain lowercase letters, numbers, and hyphens
const VALID_COIN_ID = /^[a-z0-9-]+$/;

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

const COINGECKO_BASE_URL = COINGECKO_API_KEY
    ? 'https://pro-api.coingecko.com/api/v3'
    : 'https://api.coingecko.com/api/v3';

const COINGECKO_QUERY = [
    'community_data=false',
    'developer_data=false',
    'localization=false',
    'market_data=true',
    'sparkline=false',
    'tickers=false',
].join('&');

type Params = {
    params: {
        coinId: string;
    };
};

export async function GET(_request: Request, { params: { coinId } }: Params) {
    if (!coinId || !VALID_COIN_ID.test(coinId)) {
        return NextResponse.json({ error: 'Invalid coin id' }, { status: 400 });
    }

    try {
        const response = await fetch(`${COINGECKO_BASE_URL}/coins/${coinId}?${COINGECKO_QUERY}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(COINGECKO_API_KEY && { 'x-cg-pro-api-key': COINGECKO_API_KEY }),
            },
        });

        if (!response.ok) {
            if (response.status === 429) {
                Sentry.captureMessage('Coingecko API rate limit exceeded', { level: 'warning' });
            } else {
                Sentry.captureException(new Error(`Coingecko API error: ${response.status}`));
            }
            return NextResponse.json(
                { error: 'Failed to fetch coingecko data' },
                { headers: NO_STORE_HEADERS, status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data, { headers: CACHE_HEADERS });
    } catch (error) {
        Logger.error(new Error('Coingecko API error', { cause: error }));
        Sentry.captureException(error);
        return NextResponse.json(
            { error: 'Failed to fetch coingecko data' },
            { headers: NO_STORE_HEADERS, status: 500 }
        );
    }
}
