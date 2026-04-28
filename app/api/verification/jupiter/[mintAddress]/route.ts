import { PublicKey } from '@solana/web3.js';
import { NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { array, boolean, is, optional, string, type } from 'superstruct';

import { NO_STORE_HEADERS } from '@/app/shared/lib/http-utils';
import { Logger } from '@/app/shared/lib/logger';

import { CACHE_HEADERS } from '../../config';

const JupiterTokenSchema = type({
    id: string(),
    isVerified: optional(boolean()),
});

const JupiterResponseSchema = array(JupiterTokenSchema);

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
        const response = await fetch(`https://api.jup.ag/tokens/v2/search?query=${mintAddress}`, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': JUPITER_API_KEY,
            },
        });

        if (!response.ok) {
            if (response.status === 429) {
                Logger.warn('[api:jupiter] Rate limit exceeded', { sentry: true });
            } else if (response.status !== 404) {
                Logger.panic(new Error(`Jupiter API error: ${response.status}`));
            }
            return NextResponse.json(
                { error: 'Failed to fetch jupiter data' },
                { headers: NO_STORE_HEADERS, status: response.status },
            );
        }

        const data = await response.json();

        if (!is(data, JupiterResponseSchema)) {
            return NextResponse.json({ verified: false }, { headers: CACHE_HEADERS });
        }

        const token = data.find(t => t.id === mintAddress);
        return NextResponse.json({ verified: token?.isVerified === true }, { headers: CACHE_HEADERS });
    } catch (error) {
        Logger.panic(error instanceof Error ? error : new Error('Failed to fetch jupiter data'));
        return NextResponse.json({ error: 'Failed to fetch jupiter data' }, { headers: NO_STORE_HEADERS, status: 500 });
    }
}
