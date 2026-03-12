import * as Sentry from '@sentry/nextjs';
import { PublicKey } from '@solana/web3.js';
import { NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { is, number, refine, type } from 'superstruct';

import Logger from '@/app/utils/logger';

import { CACHE_HEADERS, NO_STORE_HEADERS } from './config';

const JupiterPriceTokenSchema = type({
    usdPrice: refine(number(), 'positive', value => value > 0),
});

type JupiterPriceV3Response = Record<string, { usdPrice: number }>;

const JUPITER_API_KEY = process.env.JUPITER_API_KEY;

type Params = {
    params: {
        mintAddress: string;
    };
};

export async function GET(_request: Request, { params: { mintAddress } }: Params) {
    try {
        new PublicKey(mintAddress);
    } catch {
        return NextResponse.json({ error: 'Invalid mint address' }, { status: 400 });
    }

    if (!JUPITER_API_KEY) {
        return NextResponse.json({ error: 'Jupiter API is misconfigured' }, { headers: NO_STORE_HEADERS, status: 500 });
    }

    try {
        const response = await fetch(`https://api.jup.ag/price/v3?ids=${mintAddress}`, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': JUPITER_API_KEY,
            },
        });

        if (!response.ok) {
            if (response.status === 429) {
                Sentry.captureMessage('Jupiter price API rate limit exceeded', { level: 'warning' });
            } else {
                Sentry.captureException(new Error(`Jupiter price API error: ${response.status}`));
            }
            return NextResponse.json(
                { error: 'Failed to fetch price data' },
                { headers: NO_STORE_HEADERS, status: response.status }
            );
        }

        const data = (await response.json()) as JupiterPriceV3Response;
        const token = data?.[mintAddress];

        if (!is(token, JupiterPriceTokenSchema)) {
            return NextResponse.json({ price: null }, { headers: CACHE_HEADERS });
        }

        return NextResponse.json({ price: token.usdPrice }, { headers: CACHE_HEADERS });
    } catch (error) {
        Logger.error(new Error('Jupiter price API error', { cause: error }));
        Sentry.captureException(error);
        return NextResponse.json({ error: 'Failed to fetch price data' }, { headers: NO_STORE_HEADERS, status: 500 });
    }
}
