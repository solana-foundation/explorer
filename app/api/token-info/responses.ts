import type { TokenInfosLookup } from '@entities/token-info/server';
import { NextResponse } from 'next/server';

export function toTokenInfosResponse(lookup: TokenInfosLookup): NextResponse {
    switch (lookup.kind) {
        case 'resolved':
            return NextResponse.json({ content: lookup.tokens });
        case 'rate-limited':
            return NextResponse.json({ error: 'Token info rate limited' }, { status: 429 });
        case 'unavailable':
            return NextResponse.json({ error: 'Token info unavailable' }, { status: 503 });
    }
}

export function invalidRequest(): NextResponse {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}
