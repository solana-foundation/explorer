import { NextResponse } from 'next/server';
import fetch, { Headers } from 'node-fetch';

import { Logger } from '@/app/shared/lib/logger';
import { Cluster, clusterFromSlug, clusterSlug } from '@/app/utils/cluster';

import { NO_STORE_HEADERS, parseResponseBody, PROXY_TIMEOUT_MS } from './config';
import { getHeliusSearchApiBaseUrl } from './helius-search-config';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const DEFAULT_SEARCH_LIMIT = 20;
const MAX_SEARCH_LIMIT = 50;

function normalizeLimit(rawLimit: string | null) {
    const parsedLimit = Number(rawLimit ?? DEFAULT_SEARCH_LIMIT);
    if (!Number.isFinite(parsedLimit)) {
        return DEFAULT_SEARCH_LIMIT;
    }

    return Math.max(1, Math.min(MAX_SEARCH_LIMIT, Math.floor(parsedLimit)));
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') ?? searchParams.get('query');
    const clusterParam = searchParams.get('cluster') ?? 'mainnet-beta';

    if (!query?.trim()) {
        return NextResponse.json(
            {
                meta: { total: 0 },
                query: '',
                queryType: 'text',
                results: {},
                success: true,
            },
            { headers: NO_STORE_HEADERS },
        );
    }

    const baseUrl = getHeliusSearchApiBaseUrl();
    if (!baseUrl) {
        Logger.error(new Error('[api:search] Helius search API base URL is not configured'));
        return NextResponse.json(
            { error: 'Helius search is not configured' },
            { headers: NO_STORE_HEADERS, status: 500 },
        );
    }

    const cluster = clusterFromSlug(clusterParam) ?? Cluster.MainnetBeta;
    const upstreamUrl = new URL(`${baseUrl}/search`);
    upstreamUrl.searchParams.set('query', query.trim());
    upstreamUrl.searchParams.set('limit', normalizeLimit(searchParams.get('limit')).toString());
    upstreamUrl.searchParams.set('cluster', clusterSlug(cluster));

    const upstreamHeaders = new Headers({ Accept: 'application/json' });
    const authorizationHeader = request.headers.get('Authorization');
    if (authorizationHeader) {
        upstreamHeaders.set('Authorization', authorizationHeader);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

    try {
        const upstreamResponse = await fetch(upstreamUrl, {
            headers: upstreamHeaders,
            signal: controller.signal,
        });

        const responseText = await upstreamResponse.text();
        const responseBody = parseResponseBody(responseText);

        return NextResponse.json(responseBody, {
            headers: NO_STORE_HEADERS,
            status: upstreamResponse.status,
        });
    } catch (error) {
        Logger.error(error instanceof Error ? error : new Error('[api:search] Helius search proxy failed'), {
            cluster: clusterSlug(cluster),
            query: query.trim(),
        });

        return NextResponse.json({ error: 'Helius search request failed' }, { headers: NO_STORE_HEADERS, status: 502 });
    } finally {
        clearTimeout(timeoutId);
    }
}
