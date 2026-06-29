import { CoinGeckoVerificationSchema } from '@entities/coingecko/server';
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

type Params = { params: Promise<{ address: string }> };

export async function GET(_request: Request, props: Params) {
    const { address } = await props.params;

    try {
        new PublicKey(address);
    } catch {
        return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }

    const { url, headers } = getCoinGeckoOnchainConfig(address);

    try {
        const response = await fetchUpstream(url, { headers });

        if (!response.ok) {
            if (response.status === 429) {
                Logger.warn('[api:coingecko] Rate limit exceeded', { sentry: true });
            } else if (response.status === 404) {
                Logger.warn('[api:coingecko] No data found', { address });
            } else {
                Logger.panic(new Error(`CoinGecko onchain info API error: ${response.status}`));
            }
            return NextResponse.json(
                { error: 'Failed to fetch coingecko data' },
                { headers: NO_STORE_HEADERS, status: response.status },
            );
        }

        let data: unknown;
        try {
            data = await response.json();
        } catch {
            Logger.warn('[api:coingecko] Failed to parse upstream JSON', { address, sentry: true });
            return NextResponse.json(
                { error: 'Invalid response from coingecko API' },
                { headers: ERROR_CACHE_HEADERS, status: 502 },
            );
        }

        if (!is(data, CoinGeckoVerificationSchema)) {
            Logger.warn('[api:coingecko] Invalid response schema', { address, sentry: true });
            return NextResponse.json(
                { error: 'Invalid response from coingecko API' },
                { headers: ERROR_CACHE_HEADERS, status: 502 },
            );
        }

        return NextResponse.json(
            {
                coinGeckoId: data.data.attributes.coingecko_coin_id ?? undefined,
                verified: data.data.attributes.gt_verified === true,
            },
            { headers: CACHE_HEADERS },
        );
    } catch (error) {
        if (isTimeoutError(error)) {
            Logger.warn('[api:coingecko] Upstream request timed out', { address, sentry: true });
            return NextResponse.json(
                { error: 'Upstream request timed out' },
                { headers: ERROR_CACHE_HEADERS, status: 504 },
            );
        }
        Logger.panic(error instanceof Error ? error : new Error('Failed to fetch coingecko data'));
        return NextResponse.json(
            { error: 'Failed to fetch coingecko data' },
            { headers: NO_STORE_HEADERS, status: 500 },
        );
    }
}

// Verification reads the on-chain token-info endpoint's `data.attributes.gt_verified`.
// Two APIs return an identical { data: { attributes: { gt_verified } } } shape.
// - CoinGecko Pro (keyed, higher rate limit):
//    Docs: https://docs.coingecko.com/reference/token-info-contract-address
//    GET /api/v3/onchain/networks/{network}/tokens/{address}/info
// - GeckoTerminal public (fallback):
//    Docs: https://apiguide.geckoterminal.com/  (reference: https://api.geckoterminal.com/docs/index.html)
//    GET /api/v2/networks/{network}/tokens/{address}/info
function getCoinGeckoOnchainConfig(address: string): { headers: Record<string, string>; url: string } {
    const apiKey = process.env.COINGECKO_API_KEY;
    if (apiKey) {
        return {
            headers: { 'Content-Type': 'application/json', 'x-cg-pro-api-key': apiKey },
            url: `https://pro-api.coingecko.com/api/v3/onchain/networks/solana/tokens/${address}/info`,
        };
    }

    return {
        headers: { 'Content-Type': 'application/json' },
        url: `https://api.geckoterminal.com/api/v2/networks/solana/tokens/${address}/info`,
    };
}
