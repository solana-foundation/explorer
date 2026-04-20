import { PublicKey } from '@solana/web3.js';
import { NextResponse } from 'next/server';
import fetch, { type Response } from 'node-fetch';
import { is, number, type } from 'superstruct';

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
            const noDataStatus = await getNoDataStatus(response);
            if (noDataStatus) {
                return NextResponse.json(
                    { error: 'No rugcheck data available' },
                    { headers: NO_STORE_HEADERS, status: noDataStatus },
                );
            }

            if (response.status === 429) {
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

// Rugcheck returns 400 with various error messages for tokens it can't process
// instead of using proper status codes. See https://api.rugcheck.xyz/swagger/index.html
type NoDataStatusCode = 404 | 422;

const RUGCHECK_NO_DATA_ERRORS: Partial<Record<string, NoDataStatusCode>> = {
    'not found': 404,
    'unable to generate report': 422,
};

async function getNoDataStatus(response: Response): Promise<NoDataStatusCode | undefined> {
    if (response.status === 404) return 404;
    if (response.status !== 400) return undefined;
    const error = await getErrorMessage(response);
    if (error) return RUGCHECK_NO_DATA_ERRORS[error];
    return undefined;
}

async function getErrorMessage(response: Response): Promise<string | undefined> {
    try {
        const { error } = (await response.json()) as { error?: string };
        return error;
    } catch {
        return undefined;
    }
}
