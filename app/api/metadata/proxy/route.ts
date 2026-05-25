import { NextResponse } from 'next/server';

import { Logger } from '@/app/shared/lib/logger';

import {
    checkURLForPrivateIP,
    fetchResource,
    isHTTPProtocol,
    matchJsonContent,
    STATUS_MESSAGES,
    type StatusCode,
    StatusError,
} from './feature';

export const dynamic = 'force-dynamic';

const USER_AGENT = process.env.NEXT_PUBLIC_METADATA_USER_AGENT ?? 'Solana Explorer';
const MAX_SIZE = process.env.NEXT_PUBLIC_METADATA_MAX_CONTENT_SIZE
    ? Number(process.env.NEXT_PUBLIC_METADATA_MAX_CONTENT_SIZE)
    : 1_000_000; // 1 000 000 bytes
const TIMEOUT = process.env.NEXT_PUBLIC_METADATA_TIMEOUT ? Number(process.env.NEXT_PUBLIC_METADATA_TIMEOUT) : 10_000;

// Prevent proxied content (e.g. SVG with embedded scripts) from executing
// anything if the proxy URL is opened directly as a top-level document.
const SECURITY_HEADERS = {
    'Content-Security-Policy':
        "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:; frame-ancestors 'none'",
    'X-Content-Type-Options': 'nosniff',
};

export async function GET(request: Request) {
    if (process.env.NEXT_PUBLIC_METADATA_ENABLED !== 'true') {
        return respondWithError(404);
    }

    // searchParams.get() decodes the percent-encoded value — no additional
    // decodeURIComponent needed. The client encodes once via encodeURIComponent
    // in getProxiedUri, and this single decode reverses it symmetrically.
    const uri = new URL(request.url).searchParams.get('uri');
    const parsedUri = parseUrl(uri);
    if (!parsedUri) {
        return respondWithError(400);
    }

    if (!isHTTPProtocol(parsedUri)) {
        Logger.error(new Error('[api:metadata-proxy] Unsupported protocol'), { protocol: parsedUri.protocol });
        return respondWithError(400);
    }

    if (await checkURLForPrivateIP(parsedUri)) {
        Logger.error(new Error('[api:metadata-proxy] Private IP detected'), { hostname: parsedUri.hostname });
        return respondWithError(403);
    }

    try {
        const { data, headers } = await fetchResource(
            parsedUri.href,
            new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'User-Agent': USER_AGENT }),
            TIMEOUT,
            MAX_SIZE,
        );
        return buildResponse(data, headers);
    } catch (e) {
        if (e instanceof StatusError && isKnownStatus(e.status)) {
            return respondWithError(e.status);
        }
        // Defensive: fetchResource is expected to only throw StatusError. Log
        // anything else so we notice if that invariant breaks.
        Logger.error(e);
        return respondWithError(500);
    }
}

function parseUrl(maybeUrl: string | null): URL | undefined {
    if (!maybeUrl) return undefined;
    try {
        return new URL(maybeUrl);
    } catch (error) {
        Logger.error(new Error('[api:metadata-proxy] Invalid URL', { cause: error }));
        return undefined;
    }
}

// Content-Length is intentionally omitted to avoid browser CORS issues:
// some upstream servers (e.g. AWS S3/CDNs) return Content-Length, which makes
// the browser treat the response as "non-simple" CORS, requiring
// Access-Control-Allow-Origin headers that many upstreams don't provide.
// Omitting it keeps only safelisted headers, letting the browser accept
// the response without extra CORS checks.
function buildResponse(data: unknown, resourceHeaders: Headers): NextResponse {
    const responseHeaders: Record<string, string> = {
        ...SECURITY_HEADERS,
        'Cache-Control': resourceHeaders.get('cache-control') ?? 'no-cache',
        'Content-Type': resourceHeaders.get('content-type') ?? 'application/json; charset=utf-8',
        Etag: resourceHeaders.get('etag') ?? 'no-etag',
    };

    if (data instanceof ArrayBuffer) {
        return new NextResponse(data, { headers: responseHeaders });
    }

    if (matchJsonContent(resourceHeaders.get('content-type'))) {
        return NextResponse.json(data, { headers: responseHeaders });
    }

    return respondWithError(415);
}

function isKnownStatus(status: number): status is StatusCode {
    return status in STATUS_MESSAGES;
}

function respondWithError(status: StatusCode) {
    return NextResponse.json({ error: STATUS_MESSAGES[status] }, { status });
}
