import { Logger } from '@/app/shared/lib/logger';

import { matchAbortError, matchMaxSizeError, matchTimeoutError, StatusError, statusError } from './errors';
import { checkURLForPrivateIP, isHTTPProtocol } from './ip';
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

        currentUrl = await validateRedirectTarget(outcome.location, currentUrl);

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
    const response = await doFetch(url, headers, timeout);

    if (isRedirect(response)) {
        return extractRedirect(response, url);
    }

    if (!response.ok) {
        Logger.warn('[api:metadata-proxy] Upstream returned error', { status: response.status, url: url.href });
        throw statusError(502, `Upstream returned ${response.status}`);
    }

    return { kind: 'done', value: await processResponse(response, size) };
}

async function validateRedirectTarget(location: string, currentUrl: URL): Promise<URL> {
    const nextUrl = new URL(location, currentUrl);

    if (!isHTTPProtocol(nextUrl)) {
        Logger.warn('[api:metadata-proxy] Redirect to non-HTTP protocol blocked', { location, url: currentUrl.href });
        throw statusError(403, 'Redirect target uses non-HTTP protocol');
    }

    if (await checkURLForPrivateIP(nextUrl)) {
        Logger.warn('[api:metadata-proxy] Redirect to private IP blocked (SSRF protection)', {
            location,
            url: currentUrl.href,
        });
        throw statusError(403, 'Redirect target resolves to a private IP');
    }

    return nextUrl;
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

async function doFetch(url: URL, headers: Headers, timeout: number): Promise<Response> {
    try {
        return await fetch(url.href, {
            headers,
            redirect: 'manual',
            signal: AbortSignal.timeout(timeout),
        });
    } catch (e) {
        throw handleFetchError(e, url);
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
