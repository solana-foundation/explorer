import { NextResponse } from 'next/server';

import { Logger } from '@/app/shared/lib/logger';

import { CACHE_HEADERS, MAX_SIZE, SECURITY_HEADERS, TIMEOUT, USER_AGENT } from './config';
import {
    fetchResource,
    isHTTPProtocol,
    matchJsonContent,
    STATUS_MESSAGES,
    type StatusCode,
    StatusError,
} from './feature';

export const dynamic = 'force-dynamic';
// Platform backstop. The per-hop fetch timeout (NEXT_PUBLIC_METADATA_TIMEOUT,
// 10s) bounds each hop, but not DNS resolution or the sum across redirect hops,
// so cap the whole invocation here — every cache-miss for metadata/image
// traffic runs through this one function once enabled. Kept inline (not in
// config.ts): Next reads route segment config only as literal route exports.
export const maxDuration = 15;

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

    // Note: hostname validation (private-IP, localhost, DNS rebinding) happens
    // inside fetchResource via the pinned-lookup mechanism — once per hop.
    // The kernel never sees a hostname that wasn't pre-validated.
    try {
        const { data, headers } = await fetchResource(parsedUri.href, {
            headers: new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'User-Agent': USER_AGENT }),
            size: MAX_SIZE,
            timeout: TIMEOUT,
        });
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
    // CACHE_HEADERS sets a browser-only Cache-Control (set on success
    // only); the upstream's own Cache-Control is not forwarded. The upstream
    // ETag is dropped too — the route does no conditional revalidation, so a
    // forwarded validator would be inert (and a placeholder default would risk
    // false 304 matches across distinct resources).
    const responseHeaders: Record<string, string> = {
        ...SECURITY_HEADERS,
        ...CACHE_HEADERS,
        'Content-Type': resourceHeaders.get('content-type') ?? 'application/json; charset=utf-8',
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
