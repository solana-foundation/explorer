import { PublicKey } from '@solana/web3.js';
import { NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { is, number, refine, type } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';

import { CACHE_HEADERS, JUPITER_PRICE_ENDPOINT, NO_STORE_HEADERS } from './config';

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
        const response = await fetch(`${JUPITER_PRICE_ENDPOINT}?ids=${mintAddress}`, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': JUPITER_API_KEY,
            },
        });

        if (!response.ok) {
            if (response.status === 429) {
                Logger.warn('Jupiter price API rate limit exceeded', { sentry: true });
            } else {
                Logger.error(new Error(`Jupiter price API error: ${response.status}`), { sentry: true });
            }
            return NextResponse.json(
                { error: 'Failed to fetch price data' },
                { headers: NO_STORE_HEADERS, status: response.status === 429 ? 429 : 502 },
            );
        }

        const data = (await response.json()) as JupiterPriceV3Response;
        const token = data?.[mintAddress];

        if (!is(token, JupiterPriceTokenSchema)) {
            const err = new Error(`Jupiter price API returned unexpected schema for ${mintAddress}`);
            Logger.error(err, { sentry: true });
            return NextResponse.json({ price: null }, { headers: NO_STORE_HEADERS });
        }

        return NextResponse.json({ price: token.usdPrice }, { headers: CACHE_HEADERS });
    } catch (error) {
        Logger.panic(new Error('Jupiter price API error', { cause: error }));
        return NextResponse.json({ error: 'Failed to fetch price data' }, { headers: NO_STORE_HEADERS, status: 500 });
    }
}
