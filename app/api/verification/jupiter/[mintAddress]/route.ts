import { PublicKey } from '@solana/web3.js';
import { NextResponse } from 'next/server';
import { array, boolean, is, optional, string, type } from 'superstruct';

import { NO_STORE_HEADERS } from '@/app/shared/lib/http-utils';
import { Logger } from '@/app/shared/lib/logger';

import { CACHE_HEADERS, ERROR_CACHE_HEADERS } from '../../config';
import { fetchUpstream, isTimeoutError } from '../../upstream';

const JupiterTokenSchema = type({
    id: string(),
    isVerified: optional(boolean()),
});

const JupiterResponseSchema = array(JupiterTokenSchema);

const JUPITER_API_KEY = process.env.JUPITER_API_KEY;

type Params = {
    params: Promise<{
        mintAddress: string;
    }>;
};

export async function GET(_request: Request, props: Params) {
    const { mintAddress } = await props.params;

    try {
        new PublicKey(mintAddress);
    } catch {
        return NextResponse.json({ error: 'Invalid mint address' }, { status: 400 });
    }

    if (!JUPITER_API_KEY) {
        return NextResponse.json({ error: 'Jupiter API is misconfigured' }, { headers: NO_STORE_HEADERS, status: 500 });
    }

    try {
        const response = await fetchUpstream(`https://api.jup.ag/tokens/v2/search?query=${mintAddress}`, {
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
            Logger.error(new Error('[api:jupiter] schema mismatch'), { mintAddress, sentry: true });
            return NextResponse.json(
                { error: 'Upstream schema mismatch' },
                { headers: ERROR_CACHE_HEADERS, status: 502 },
            );
        }

        const token = data.find(t => t.id === mintAddress);
        return NextResponse.json({ verified: token?.isVerified === true }, { headers: CACHE_HEADERS });
    } catch (error) {
        if (isTimeoutError(error)) {
            Logger.warn('[api:jupiter] Upstream request timed out', { mintAddress, sentry: true });
            return NextResponse.json(
                { error: 'Upstream request timed out' },
                { headers: ERROR_CACHE_HEADERS, status: 504 },
            );
        }
        Logger.panic(error instanceof Error ? error : new Error('Failed to fetch jupiter data'));
        return NextResponse.json({ error: 'Failed to fetch jupiter data' }, { headers: NO_STORE_HEADERS, status: 500 });
    }
}
