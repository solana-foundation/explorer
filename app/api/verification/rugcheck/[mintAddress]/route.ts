import { PublicKey } from '@solana/web3.js';
import { NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { is, literal, number, type } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';

import { CACHE_HEADERS, NO_STORE_HEADERS } from '../../config';

const RugCheckResponseSchema = type({
    score_normalised: number(),
});

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

    const apiKey = process.env.RUGCHECK_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: 'Rugcheck API is misconfigured' },
            { headers: NO_STORE_HEADERS, status: 500 },
        );
    }

    try {
        const response = await fetch(`https://premium.rugcheck.xyz/v1/tokens/${mintAddress}/report`, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
            },
        });

        if (!response.ok) {
            if (response.status === 404 || (await isNotFoundResponse(response))) {
                Logger.debug('[api:rugcheck] Token not found', { mintAddress });
                return NextResponse.json(
                    { error: 'Failed to fetch rugcheck data' },
                    { headers: NO_STORE_HEADERS, status: 404 },
                );
            } else if (response.status === 429) {
                Logger.warn('[api:rugcheck] Rate limit exceeded', { sentry: true });
            } else {
                Logger.panic(new Error(`Rugcheck API error: ${response.status}`));
            }
            return NextResponse.json(
                { error: 'Failed to fetch rugcheck data' },
                { headers: NO_STORE_HEADERS, status: response.status },
            );
        }

        const data = await response.json();

        if (!is(data, RugCheckResponseSchema)) {
            return NextResponse.json(
                { error: 'Invalid response from rugcheck API' },
                { headers: NO_STORE_HEADERS, status: 502 },
            );
        }

        return NextResponse.json({ score: data.score_normalised }, { headers: CACHE_HEADERS });
    } catch (error) {
        Logger.panic(error instanceof Error ? error : new Error('Failed to fetch rugcheck data'));
        return NextResponse.json(
            { error: 'Failed to fetch rugcheck data' },
            { headers: NO_STORE_HEADERS, status: 500 },
        );
    }
}

const RugCheckNotFoundSchema = type({
    error: literal('not found'),
});

// Rugcheck returns 400 {"error":"not found"} for unrecognized tokens instead of 404
async function isNotFoundResponse(response: import('node-fetch').Response): Promise<boolean> {
    if (response.status !== 400) return false;
    try {
        const body = await response.json();
        return is(body, RugCheckNotFoundSchema);
    } catch {
        return false;
    }
}
