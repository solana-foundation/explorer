import { Agent } from 'undici';

import { err, ok, type Result } from '@/app/shared/lib/result';

import { matchAbortError, matchMaxSizeError, matchTimeoutError, type StatusError, statusError } from './errors';
import { isHTTPProtocol, lookupHostnameSafely } from './ip';
import { isPassthroughStatus, toProxyStatus } from './lib/upstream-status';
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

// `byteLength` and `host` (of the final hop) let the caller record the fetched-size distribution.
export type FetchedResource = { data: unknown; headers: Headers; byteLength: number; host: string };

type HopResult = { kind: 'done'; value: FetchedResource } | { kind: 'redirect'; location: string };

// Per-request fetch parameters that travel together through every hop. Bundled
// into one object so helpers don't grow long positional argument lists.
export type FetchRequest = { headers: Headers; timeout: number; size: number };

/**
 * Fetches `uri` through the SSRF-safe pipeline. Expected failures come back as a {@link StatusError}
 * carrying a `code` and log `context`; logging them is the caller's decision.
 */
export async function fetchResource(uri: string, request: FetchRequest): Promise<Result<FetchedResource, StatusError>> {
    let currentUrl = new URL(uri);
    const visited = new Set<string>([currentUrl.href]);

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        const [error, outcome] = await executeHop(currentUrl, request);
        if (error) return err(error);
        if (outcome.kind === 'done') return ok(outcome.value);

        currentUrl = resolveRedirectUrl(outcome.location, currentUrl);

        if (visited.has(currentUrl.href)) {
            return err(
                statusError(502, 'Redirect loop detected', {
                    code: 'redirect-loop',
                    context: { url: currentUrl.href },
                }),
            );
        }
        visited.add(currentUrl.href);
    }

    return err(
        statusError(502, 'Too many redirects', { code: 'too-many-redirects', context: { url: currentUrl.href } }),
    );
}

async function executeHop(url: URL, request: FetchRequest): Promise<Result<HopResult, StatusError>> {
    if (!isHTTPProtocol(url)) {
        return err(
            statusError(403, 'Hostname uses non-HTTP protocol', {
                code: 'non-http-protocol',
                context: { url: url.href },
            }),
        );
    }

    // Resolve DNS *and* pin the result. The returned `lookup` is plugged into
    // undici's connect call below, so the kernel never re-resolves the
    // hostname — closing the DNS-rebinding TOCTOU window.
    const validation = await lookupHostnameSafely(url.hostname);
    if (validation.kind === 'private') {
        return err(
            statusError(403, `Hostname resolution blocked: ${validation.reason}`, {
                cause: validation.cause,
                code: 'ssrf-blocked',
                // TODO(<ticket>): a DNS failure is not an SSRF block; give it its own code and log level
                context: { error: validation.cause, hostname: url.hostname, reason: validation.reason },
            }),
        );
    }

    // Dispatcher ownership lives here, not inside doFetch — closing it must
    // happen *after* processResponse has drained the response body, otherwise
    // we'd be tearing down sockets while the body stream is still being read.
    const dispatcher = new Agent({ connect: { lookup: validation.lookup } });
    try {
        const [fetchError, response] = await doFetch(url, request, dispatcher);
        if (fetchError) return err(fetchError);

        if (isRedirect(response)) {
            return extractRedirect(response, url);
        }

        if (!response.ok) {
            return err(upstreamStatusError(response, url));
        }

        const [processError, value] = await processResponse(response, request, url);
        return processError ? err(processError) : ok({ kind: 'done', value });
    } finally {
        // By this point the body has either been fully consumed (success
        // path), cancelled (size pre-check), or abandoned (errors in
        // processResponse). `close()` waits for any remaining in-flight
        // stream to settle and is preferred over `destroy()`; swallowing
        // the rejection avoids masking an upstream error with a cleanup
        // error.
        await dispatcher.close().catch(() => undefined);
    }
}

function upstreamStatusError(response: Response, url: URL): StatusError {
    const { status } = response;
    const retryAfter = status === 429 ? (response.headers.get('retry-after') ?? undefined) : undefined;
    return statusError(toProxyStatus(status), `Upstream returned ${status}`, {
        code: isPassthroughStatus(status) ? 'upstream-status' : 'unlisted-upstream-status',
        context: { host: url.host, status, url: url.href },
        retryAfter,
    });
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

function extractRedirect(response: Response, url: URL): Result<HopResult, StatusError> {
    const location = response.headers.get('location');
    if (!location) {
        return err(
            statusError(502, 'Redirect missing Location header', {
                code: 'redirect-missing-location',
                context: { status: response.status, url: url.href },
            }),
        );
    }
    return ok({ kind: 'redirect', location });
}

async function doFetch(url: URL, request: FetchRequest, dispatcher: Agent): Promise<Result<Response, StatusError>> {
    try {
        return ok(
            await fetch(url.href, {
                headers: request.headers,
                redirect: 'manual',
                signal: AbortSignal.timeout(request.timeout),
                // `dispatcher` is an undici-specific extension to RequestInit, not
                // in the Web Fetch spec; spreading defeats the excess-property
                // check while still passing it through to Node's native fetch
                // (which is undici under the hood). Lifecycle is owned by the
                // caller (`executeHop`) so cleanup runs after body consumption.
                ...{ dispatcher },
            }),
        );
    } catch (e) {
        return err(classifyFetchError(e, url, request.size));
    }
}

async function processResponse(
    response: Response,
    request: FetchRequest,
    url: URL,
): Promise<Result<FetchedResource, StatusError>> {
    const { size } = request;
    // Pre-check Content-Length when present so oversize bodies fail fast.
    // A malformed header (e.g. "abc") parses to NaN; ignore it and fall through
    // to readBodyWithLimit, which enforces the limit on the actual byte count.
    const contentLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > size) {
        await response.body?.cancel();
        return err(
            statusError(413, `Content-Length ${contentLength} exceeds max size ${size}`, {
                code: 'oversize-declared',
                context: { declaredContentLength: contentLength, host: url.host, maxSize: size },
            }),
        );
    }

    let buffered: ArrayBuffer;
    try {
        buffered = await readBodyWithLimit(response, size);
    } catch (e) {
        if (matchMaxSizeError(e)) {
            // Server omitted or understated Content-Length; the limit was hit mid-stream.
            return err(
                statusError(413, 'Streamed body exceeds max size', {
                    cause: e,
                    code: 'oversize-streamed',
                    context: { host: url.host, maxSize: size },
                }),
            );
        }
        throw e;
    }
    const contentType = response.headers.get('content-type');

    const process = pickProcessor(contentType);
    if (!process) {
        return err(
            statusError(415, `Unsupported content-type: ${contentType ?? '(none)'}`, {
                code: 'unsupported-content-type',
                context: { contentType, host: url.host },
            }),
        );
    }

    // Re-wrap so processors keep using `.arrayBuffer()` / `.json()` / `.text()`.
    const [processError, processed] = await process(
        new Response(buffered, { headers: response.headers, status: response.status }),
    );
    if (processError) return err(processError);
    return ok({ ...processed, byteLength: buffered.byteLength, host: url.host });
}

function pickProcessor(contentType: string | null) {
    if (matchJson(contentType)) return processJson;
    if (matchTextPlain(contentType)) return processTextAsJson;
    if (matchImage(contentType)) return processBinary;
    return undefined;
}

function classifyFetchError(e: unknown, url: URL, size: number): StatusError {
    const error = e instanceof Error ? e : new Error('Cannot fetch resource', { cause: e });

    if (matchTimeoutError(error)) {
        return statusError(504, 'Upstream fetch timed out', {
            cause: error,
            code: 'timeout',
            context: { url: url.href },
        });
    }
    if (matchMaxSizeError(error)) {
        // fetch() itself rejected with a size error (limit hit before a Response was returned).
        return statusError(413, 'Streamed body exceeds max size', {
            cause: error,
            code: 'oversize-streamed',
            context: { host: url.host, maxSize: size },
        });
    }
    if (matchAbortError(error)) {
        return statusError(504, 'Upstream fetch aborted', {
            cause: error,
            code: 'aborted',
            context: { url: url.href },
        });
    }

    // Anything left is a `fetch()` rejection that isn't a timeout/abort/size
    // error — i.e. an upstream connectivity failure (DNS miss, refused/reset
    // connection, TLS error). That's a bad *gateway*, not our internal fault, so
    // it's a 502, not a 500. The distinction is user-visible: 502 surfaces as
    // "Image source unavailable" while 500 collapses to the generic "Image could
    // not be displayed".
    return statusError(502, 'Upstream unreachable', { cause: error, code: 'unreachable', context: { url: url.href } });
}
