import { PUBLIC_KEY_LENGTH } from '@solana/web3.js';
import bs58 from 'bs58';
import { NextResponse } from 'next/server';

import { resolveSearchTokens, SEARCH_CACHE_HEADERS } from '@/app/features/search/server';
import { NO_STORE_HEADERS } from '@/app/shared/lib/http-utils';
import { Cluster, clusterFromSlug } from '@/app/utils/cluster';

const SEARCH_QUERY_MAX_LENGTH = 200;

function detectQueryType(query: string): 'address' | 'text' {
    try {
        const decoded = bs58.decode(query);
        return decoded.length === PUBLIC_KEY_LENGTH ? 'address' : 'text';
    } catch {
        return 'text';
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') ?? searchParams.get('query') ?? '';
    const clusterParam = searchParams.get('cluster') ?? 'mainnet-beta';

    const trimmed = query.trim();

    if (!trimmed || trimmed.length > SEARCH_QUERY_MAX_LENGTH) {
        return NextResponse.json(
            { meta: { total: 0 }, query: trimmed, queryType: 'text', results: { tokens: [] }, success: true },
            { headers: SEARCH_CACHE_HEADERS },
        );
    }

    const cluster = clusterFromSlug(clusterParam) ?? Cluster.MainnetBeta;

    if (cluster !== Cluster.MainnetBeta) {
        return NextResponse.json(
            {
                meta: { total: 0 },
                query: trimmed,
                queryType: detectQueryType(trimmed),
                results: { tokens: [] },
                success: true,
            },
            { headers: NO_STORE_HEADERS },
        );
    }

    const queryType = detectQueryType(trimmed);
    const tokens = await resolveSearchTokens(trimmed, clusterParam);

    return NextResponse.json(
        { meta: { total: tokens.length }, query: trimmed, queryType, results: { tokens }, success: true },
        { headers: SEARCH_CACHE_HEADERS },
    );
}
