import { PUBLIC_KEY_LENGTH } from '@solana/web3.js';
import { Cluster, clusterFromSlug, clusterSlug } from '@utils/cluster';
import bs58 from 'bs58';
import { NextResponse } from 'next/server';

import { GENESIS_HASHES } from '@/app/entities/chain-id/lib/const';
import { resolveSearchTokens, SEARCH_CACHE_HEADERS } from '@/app/features/search/server';
import { NO_STORE_HEADERS } from '@/app/shared/lib/http-utils';

const SEARCH_QUERY_MAX_LENGTH = 200;

function clusterFromGenesisHash(genesisHash: string): Cluster | null {
    switch (genesisHash) {
        case GENESIS_HASHES.MAINNET:
            return Cluster.MainnetBeta;
        case GENESIS_HASHES.TESTNET:
            return Cluster.Testnet;
        case GENESIS_HASHES.DEVNET:
            return Cluster.Devnet;
        default:
            return null;
    }
}

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
    const clusterParam = searchParams.get('cluster');

    const trimmed = query.trim();

    if (!trimmed || trimmed.length > SEARCH_QUERY_MAX_LENGTH) {
        return NextResponse.json(
            { meta: { total: 0 }, query: trimmed, queryType: 'text', results: { tokens: [] }, success: true },
            { headers: SEARCH_CACHE_HEADERS },
        );
    }

    const cluster = clusterFromSlug(clusterParam || clusterSlug(Cluster.MainnetBeta));

    if (cluster === null) {
        return NextResponse.json(
            { error: 'Invalid cluster', success: false },
            { headers: NO_STORE_HEADERS, status: 400 },
        );
    }

    if (cluster === Cluster.Custom) {
        const genesisHash = searchParams.get('genesisHash');
        const resolvedCluster = genesisHash ? clusterFromGenesisHash(genesisHash) : null;

        if (resolvedCluster === null) {
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
        const tokens = await resolveSearchTokens(trimmed, resolvedCluster);
        return NextResponse.json(
            { meta: { total: tokens.length }, query: trimmed, queryType, results: { tokens }, success: true },
            { headers: SEARCH_CACHE_HEADERS },
        );
    }

    // SIMD-296 is an experimental cluster not covered by Jupiter/UTL token lists.
    if (cluster === Cluster.Simd296) {
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
    const tokens = await resolveSearchTokens(trimmed, cluster);

    return NextResponse.json(
        { meta: { total: tokens.length }, query: trimmed, queryType, results: { tokens }, success: true },
        { headers: SEARCH_CACHE_HEADERS },
    );
}
