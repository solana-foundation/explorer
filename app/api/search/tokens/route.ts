import { NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { array, boolean, is, number, optional, string, type } from 'superstruct';

import { Logger } from '@/app/shared/lib/logger';
import { Cluster, clusterFromSlug } from '@/app/utils/cluster';

import { CACHE_HEADERS, NO_STORE_HEADERS } from '../config';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const JUPITER_API_KEY = process.env.JUPITER_API_KEY;
const TIMEOUT_MS = 5000;

export type TokenSearchResult = {
    address: string;
    holderCount: number;
    logoUri: string | null;
    name: string;
    symbol: string;
    verified: boolean;
};

const JupiterTokenSchema = type({
    holderCount: optional(number()),
    icon: optional(string()),
    id: string(),
    isVerified: optional(boolean()),
    liquidity: optional(number()),
    name: optional(string()),
    organicScore: optional(number()),
    symbol: optional(string()),
});

const JupiterSearchResponseSchema = array(JupiterTokenSchema);

const UtlTokenSchema = type({
    address: string(),
    holders: optional(number()),
    logoUri: optional(string()),
    name: string(),
    symbol: string(),
    verified: boolean(),
});

const UtlSearchResponseSchema = type({
    content: array(UtlTokenSchema),
});

function scoreToken(
    symbol: string,
    name: string,
    verified: boolean,
    query: string,
    holderCount: number,
    organicScore?: number,
    liquidity?: number,
): number {
    const q = query.toLowerCase().trim();
    const sym = symbol.toLowerCase();
    const nam = name.toLowerCase();

    let score = 0;
    if (sym === q) score += 10_000;
    else if (sym.startsWith(q)) score += 5_000;
    else if (nam === q) score += 3_000;
    else if (nam.startsWith(q)) score += 1_000;

    if (verified) score += 500;
    score += (organicScore ?? 0) * 4;
    score += Math.log10(holderCount + 1) * 10;
    score += Math.log10((liquidity ?? 0) + 1);

    return score;
}

async function searchMainnet(query: string): Promise<NextResponse> {
    if (!JUPITER_API_KEY) {
        return NextResponse.json({ error: 'Jupiter API is misconfigured' }, { headers: NO_STORE_HEADERS, status: 500 });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(`https://api.jup.ag/tokens/v2/search?query=${encodeURIComponent(query)}`, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': JUPITER_API_KEY,
            },
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            if (response.status === 429) {
                Logger.warn('[api:search/tokens] Jupiter rate limit exceeded', { sentry: true });
            } else {
                Logger.panic(new Error(`[api:search/tokens] Jupiter API error: ${response.status}`));
            }
            return NextResponse.json(
                { error: 'Failed to fetch token search results' },
                { headers: NO_STORE_HEADERS, status: response.status },
            );
        }

        const data = await response.json();

        if (!is(data, JupiterSearchResponseSchema)) {
            return NextResponse.json(
                { error: 'Invalid response from Jupiter API' },
                { headers: NO_STORE_HEADERS, status: 502 },
            );
        }

        const tokens: TokenSearchResult[] = data
            .map(token => ({
                _score: scoreToken(
                    token.symbol ?? '',
                    token.name ?? '',
                    token.isVerified ?? false,
                    query,
                    token.holderCount ?? 0,
                    token.organicScore,
                    token.liquidity,
                ),
                address: token.id,
                holderCount: token.holderCount ?? 0,
                logoUri: token.icon ?? null,
                name: token.name ?? '',
                symbol: token.symbol ?? '',
                verified: token.isVerified ?? false,
            }))
            .sort((a, b) => b._score - a._score)
            .map(({ _score: _s, ...t }) => t);

        return NextResponse.json({ tokens }, { headers: CACHE_HEADERS });
    } catch (error) {
        clearTimeout(timeoutId);
        Logger.panic(error instanceof Error ? error : new Error('[api:search/tokens] Jupiter search failed'));
        return NextResponse.json(
            { error: 'Failed to fetch token search results' },
            { headers: NO_STORE_HEADERS, status: 500 },
        );
    }
}

async function searchOtherCluster(query: string, chainId: number): Promise<NextResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(
            `https://token-list-api.solana.cloud/v1/search?query=${encodeURIComponent(query)}&chainId=${chainId}&start=0&limit=20`,
            { signal: controller.signal },
        );
        clearTimeout(timeoutId);

        if (!response.ok) {
            if (response.status === 429) {
                Logger.warn('[api:search/tokens] UTL API rate limit exceeded', { sentry: true });
            } else {
                Logger.panic(new Error(`[api:search/tokens] UTL API error: ${response.status}`));
            }
            return NextResponse.json(
                { error: 'Failed to fetch token search results' },
                { headers: NO_STORE_HEADERS, status: response.status },
            );
        }

        const data = await response.json();

        if (!is(data, UtlSearchResponseSchema)) {
            return NextResponse.json(
                { error: 'Invalid response from UTL API' },
                { headers: NO_STORE_HEADERS, status: 502 },
            );
        }

        const tokens: TokenSearchResult[] = data.content
            .map(token => ({
                _score: scoreToken(token.symbol, token.name, token.verified, query, token.holders ?? 0),
                address: token.address,
                holderCount: token.holders ?? 0,
                logoUri: token.logoUri ?? null,
                name: token.name,
                symbol: token.symbol,
                verified: token.verified,
            }))
            .sort((a, b) => b._score - a._score)
            .map(({ _score: _s, ...t }) => t);

        return NextResponse.json({ tokens }, { headers: CACHE_HEADERS });
    } catch (error) {
        clearTimeout(timeoutId);
        Logger.panic(error instanceof Error ? error : new Error('[api:search/tokens] UTL search failed'));
        return NextResponse.json(
            { error: 'Failed to fetch token search results' },
            { headers: NO_STORE_HEADERS, status: 500 },
        );
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const clusterSlug = searchParams.get('cluster') ?? 'mainnet-beta';

    if (!query) {
        return NextResponse.json({ tokens: [] });
    }

    const cluster = clusterFromSlug(clusterSlug);

    if (cluster === Cluster.MainnetBeta || cluster === null) {
        return searchMainnet(query);
    } else if (cluster === Cluster.Testnet) {
        return searchOtherCluster(query, 102);
    } else if (cluster === Cluster.Devnet) {
        return searchOtherCluster(query, 103);
    } else {
        // Simd296, Custom — no token search available
        return NextResponse.json({ tokens: [] });
    }
}
