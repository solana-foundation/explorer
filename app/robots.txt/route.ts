import { createHash } from 'node:crypto';

import { EXPLORER_BASE_URL, isSeoDisallowBots } from '@utils/env';
import { NextResponse } from 'next/server';

import { ifNoneMatchMatches, notModifiedResponse } from '@/app/shared/lib/http-utils';

// s-maxage is explicit but redundant: max-age already governs the shared cache. A flag flip waits
// out the freshness window either way, and the ETag only saves bytes once the entry goes stale.
const ROBOTS_CACHE_HEADERS = {
    'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
};

// Google resolves a path by longest match, not by order, so `/mcp/start` stays reachable.
const ALLOW_BOTS_CONTENT = `User-agent: *
Allow: /
Allow: /mcp/start
Disallow: /api/
Disallow: /mcp

Sitemap: ${EXPLORER_BASE_URL}/sitemap.xml
`;

const DISALLOW_BOTS_CONTENT = `User-agent: *
Disallow: /
`;

function toVariant(content: string) {
    return { content, etag: `"${createHash('sha256').update(content).digest('base64url')}"` };
}

const ALLOW_BOTS = toVariant(ALLOW_BOTS_CONTENT);
const DISALLOW_BOTS = toVariant(DISALLOW_BOTS_CONTENT);

export function GET(request: Request) {
    const variant = isSeoDisallowBots() ? DISALLOW_BOTS : ALLOW_BOTS;

    if (ifNoneMatchMatches(request.headers, variant.etag)) {
        return notModifiedResponse({ cacheHeaders: ROBOTS_CACHE_HEADERS, etag: variant.etag });
    }

    return new NextResponse(variant.content, {
        headers: {
            ...ROBOTS_CACHE_HEADERS,
            'Content-Type': 'text/plain; charset=utf-8',
            ETag: variant.etag,
        },
    });
}
