import { type NextRequest, NextResponse } from 'next/server';

import { clusterForPublicEndpoint, clusterSlug, DEFAULT_CLUSTER } from '@/app/entities/cluster/lib/cluster';
import { Logger } from '@/app/shared/lib/logger';
import { isSeoDisallowBots } from '@/app/utils/env';
import { botIdMiddleware } from '@/config/botid-middleware.mjs';

const SITEMAP_PATHS = new Set(['/sitemap.xml', '/default-sitemap.xml', '/accounts-sitemap.xml']);

// Log runtime once per cold start so any future edge↔node drift is visible without per-request overhead.
let runtimeLogged = false;

export async function proxy(request: NextRequest) {
    if (!runtimeLogged) {
        runtimeLogged = true;
        Logger.info('[proxy] cold start', {
            nodeVersion: typeof process !== 'undefined' && process.versions ? process.versions.node : undefined,
            runtime: 'EdgeRuntime' in globalThis ? 'edge' : 'node',
        });
    }

    if (SITEMAP_PATHS.has(request.nextUrl.pathname)) {
        return isSeoDisallowBots()
            ? new NextResponse('Not Found', { headers: { 'Content-Type': 'text/plain; charset=utf-8' }, status: 404 })
            : NextResponse.next();
    }

    const publicClusterRedirect = redirectPublicCustomUrl(request);
    if (publicClusterRedirect) return publicClusterRedirect;

    // Pages reach the proxy only through the `customUrl` matcher; BotID guards `/api` alone.
    if (!request.nextUrl.pathname.startsWith('/api/')) return NextResponse.next();

    const blocked = await botIdMiddleware(request);
    return blocked ?? NextResponse.next();
}

// A custom URL naming a public cluster RPC would prompt for consent; the cluster itself needs none.
function redirectPublicCustomUrl(request: NextRequest): NextResponse | undefined {
    const { searchParams } = request.nextUrl;
    if (searchParams.get('cluster') !== 'custom') return undefined;
    const cluster = clusterForPublicEndpoint(searchParams.get('customUrl') ?? '');
    if (cluster === undefined) return undefined;

    const url = request.nextUrl.clone();
    // A link without `cluster` already resolves to the default, so it stays canonical.
    if (cluster === DEFAULT_CLUSTER) url.searchParams.delete('cluster');
    else url.searchParams.set('cluster', clusterSlug(cluster));
    url.searchParams.delete('customUrl');
    return NextResponse.redirect(url, 308);
}

export const config = {
    // `matcher` repeats `SITEMAP_PATHS` because Next.js parses the exported `config` statically.
    matcher: [
        '/api/:path*',
        '/sitemap.xml',
        '/default-sitemap.xml',
        '/accounts-sitemap.xml',
        { has: [{ key: 'customUrl', type: 'query' }], source: '/:path*' },
    ],
};
