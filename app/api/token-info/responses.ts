import type { TokenInfosLookup } from '@entities/token-info/server';
import { NextResponse } from 'next/server';

type CacheHeaders = { error: HeadersInit; resolved: HeadersInit };

export function toTokenInfosResponse(lookup: TokenInfosLookup, cacheHeaders?: CacheHeaders): NextResponse {
    switch (lookup.kind) {
        case 'resolved':
            return NextResponse.json({ content: lookup.tokens }, { headers: cacheHeaders?.resolved });
        case 'rate-limited':
            return NextResponse.json(
                { error: 'Token info rate limited' },
                { headers: cacheHeaders?.error, status: 429 },
            );
        case 'unavailable':
            return NextResponse.json(
                { error: 'Token info unavailable' },
                { headers: cacheHeaders?.error, status: 503 },
            );
    }
}

export function invalidRequest(): NextResponse {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}
