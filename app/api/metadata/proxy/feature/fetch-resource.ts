import type { LookupFunction } from 'net';
import { Agent } from 'undici';

import { Logger } from '@/app/shared/lib/logger';

import { matchAbortError, matchMaxSizeError, matchTimeoutError, StatusError, statusError } from './errors';
import { isHTTPProtocol, lookupHostnameSafely } from './ip';
import { processBinary, processJson, processTextAsJson } from './processors';
import { readBodyWithLimit } from './read-body-with-limit';

// Content-type matchers
export const matchJson = (header?: string | null) => header?.includes('application/json');
export const matchTextPlain = (header?: string | null) => header?.includes('text/plain');
export const matchImage = (header?: string | null) => header?.includes('image/');
export const matchJsonContent = (header?: string | null) => matchJson(header) || matchTextPlain(header);

// Redirects are followed manually so each hop's hostname can be re-validated
// against private IP ranges. This closes an SSRF bypass where the initial
// hostname resolves to a public IP but the upstream returns a 3xx pointing at
// an internal address (e.g. 169.254.169.254 AWS metadata endpoint). Many
// legitimate metadata hosts (Arweave, CDNs) use 302s, so blocking all
// redirects is too aggressive — instead we follow up to MAX_REDIRECTS hops
// with per-hop validation.
const MAX_REDIRECTS = 3;

type FetchResourceResult = Awaited<
    ReturnType<typeof processJson> | ReturnType<typeof processTextAsJson> | ReturnType<typeof processBinary>
>;

type HopResult = { kind: 'done'; value: FetchResourceResult } | { kind: 'redirect'; location: string };

export async function fetchResource(
    uri: string,
    headers: Headers,
    timeout: number,
    size: number,
): Promise<FetchResourceResult> {
    let currentUrl = new URL(uri);
    const visited = new Set<string>([currentUrl.href]);

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        const outcome = await executeHop(currentUrl, headers, timeout, size);
        if (outcome.kind === 'done') return outcome.value;

        currentUrl = resolveRedirectUrl(outcome.location, currentUrl);

        if (visited.has(currentUrl.href)) {
            Logger.warn('[api:metadata-proxy] Redirect loop detected', { url: currentUrl.href });
            throw statusError(502, 'Redirect loop detected');
        }
        visited.add(currentUrl.href);
    }

    Logger.warn('[api:metadata-proxy] Too many redirects', { url: currentUrl.href });
    throw statusError(502, 'Too many redirects');
}

async function executeHop(url: URL, headers: Headers, timeout: number, size: number): Promise<HopResult> {
    if (!isHTTPProtocol(url)) {
        Logger.warn('[api:metadata-proxy] Non-HTTP protocol blocked', { url: url.href });
        throw statusError(403, 'Hostname uses non-HTTP protocol');
    }

    // Resolve DNS *and* pin the result. The returned `lookup` is plugged into
    // undici's connect call below, so the kernel never re-resolves the
    // hostname — closing the DNS-rebinding TOCTOU window.
    const validation = await lookupHostnameSafely(url.hostname);
    if (validation.kind === 'private') {
        Logger.warn('[api:metadata-proxy] Hostname resolution blocked (SSRF protection)', {
            hostname: url.hostname,
            reason: validation.reason,
        });
        throw statusError(403, `Hostname resolution blocked: ${validation.reason}`);
    }

    const response = await doFetch(url, headers, timeout, validation.lookup);

    if (isRedirect(response)) {
        return extractRedirect(response, url);
    }

    if (!response.ok) {
        Logger.warn('[api:metadata-proxy] Upstream returned error', { status: response.status, url: url.href });
        throw statusError(502, `Upstream returned ${response.status}`);
    }

    return { kind: 'done', value: await processResponse(response, size) };
}

function resolveRedirectUrl(location: string, currentUrl: URL): URL {
    return new URL(location, currentUrl);
}

// Only statuses that carry a `Location` header by spec. Excludes 304/305/306
// and `300 Multiple Choices` — they're 3xx but not "follow this redirect",
// and treating them as redirects turns a missing Location into a confusing
// 502. Anything else falls through to the `!response.ok` branch.
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

function isRedirect(response: Response): boolean {
    return REDIRECT_STATUSES.has(response.status);
}

function extractRedirect(response: Response, url: URL): HopResult & { kind: 'redirect' } {
    const location = response.headers.get('location');
    if (!location) {
        Logger.warn('[api:metadata-proxy] Redirect without Location header', {
            status: response.status,
            url: url.href,
        });
        throw statusError(502, 'Redirect missing Location header');
    }
    return { kind: 'redirect', location };
}

async function doFetch(url: URL, headers: Headers, timeout: number, lookup: LookupFunction): Promise<Response> {
    const dispatcher = new Agent({ connect: { lookup } });
    try {
        return await fetch(url.href, {
            headers,
            redirect: 'manual',
            signal: AbortSignal.timeout(timeout),
            // `dispatcher` is an undici-specific extension to RequestInit, not
            // in the Web Fetch spec; spreading defeats the excess-property
            // check while still passing it through to Node's native fetch
            // (which is undici under the hood).
            ...{ dispatcher },
        });
    } catch (e) {
        throw handleFetchError(e, url);
    } finally {
        // Free sockets owned by this hop. Fire-and-forget — the body has
        // already been consumed by processResponse by the time we return.
        void dispatcher.close();
    }
}

async function processResponse(response: Response, size: number): Promise<FetchResourceResult> {
    // Pre-check Content-Length when present so oversize bodies fail fast.
    // A malformed header (e.g. "abc") parses to NaN; ignore it and fall through
    // to readBodyWithLimit, which enforces the limit on the actual byte count.
    const contentLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > size) {
        await response.body?.cancel();
        throw statusError(413, `Content-Length ${contentLength} exceeds max size ${size}`);
    }

    let buffered: ArrayBuffer;
    try {
        buffered = await readBodyWithLimit(response, size);
    } catch (e) {
        if (matchMaxSizeError(e)) throw statusError(413, 'Streamed body exceeds max size', { cause: e });
        throw e;
    }
    // Re-wrap so processors keep using `.arrayBuffer()` / `.json()` / `.text()`.
    const rewrapped = new Response(buffered, { headers: response.headers, status: response.status });

    const contentType = response.headers.get('content-type');
    if (matchJson(contentType)) return processJson(rewrapped);
    if (matchTextPlain(contentType)) return processTextAsJson(rewrapped);
    if (matchImage(contentType)) return processBinary(rewrapped);

    throw statusError(415, `Unsupported content-type: ${contentType ?? '(none)'}`);
}

function handleFetchError(e: unknown, url: URL): StatusError {
    const error = e instanceof Error ? e : new Error('Cannot fetch resource');
    if (!(e instanceof Error)) {
        Logger.debug('[api:metadata-proxy] Failed to fetch resource', { error: e });
    }

    if (error instanceof StatusError) return error;
    if (matchTimeoutError(error)) return statusError(504, 'Upstream fetch timed out', { cause: error });
    if (matchMaxSizeError(error)) return statusError(413, 'Streamed body exceeds max size', { cause: error });
    if (matchAbortError(error)) return statusError(504, 'Upstream fetch aborted', { cause: error });

    // Reported to Sentry so we can gauge whether network failures are common.
    Logger.warn('[api:metadata-proxy] Fetch failed', { sentry: true, url: url.href });
    return statusError(500, 'Fetch failed', { cause: error });
}
