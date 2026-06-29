// Why a proxied image couldn't be displayed. A browser `<img>` only reports
// "it failed" (via `onError`) — never the HTTP status — so the reason is learned
// by re-`fetch`ing the same proxied URL and reading `response.status`. See
// `model/useImageFailureReason` for the React wiring.

export type ImageFailure = {
    /** Proxy HTTP status, or 0 when it couldn't be read (network/opaque/abort). */
    status: number;
    /** Human-readable, per-status explanation suitable for display. */
    reason: string;
};

const GENERIC_REASON = 'Image could not be displayed';

// Friendly copy keyed by the proxy's status codes (see the proxy's
// STATUS_MESSAGES). Unmapped statuses fall back to GENERIC_REASON. The 413 copy
// stays generic ("maximum size") rather than naming the exact cap: the limit is
// an internal threshold, so least-disclosure is preferred, and the copy stays
// correct if the cap is ever tuned.
const REASON_BY_STATUS: Record<number, string> = {
    400: GENERIC_REASON,
    403: 'Image access denied',
    404: 'Image not found',
    413: 'Image exceeds maximum size',
    415: 'Unsupported image type',
    500: GENERIC_REASON,
    502: 'Image source unavailable',
    504: 'Image source timed out',
};

export function reasonForStatus(status: number): string {
    return REASON_BY_STATUS[status] ?? GENERIC_REASON;
}

// Only the same-origin proxy returns a status we can read; a raw cross-origin
// URL (proxy disabled, or a non-HTTP scheme passed through) yields an opaque
// response, so there's nothing to probe.
export function isProxiedSrc(src: string): boolean {
    return src.startsWith('/api/metadata/proxy');
}

// Cache verdicts per src so the same broken resource (re-renders, the same logo
// across many rows, a remount) is probed at most once. The HTTP layer caches the
// proxy's error response briefly too, so a miss here is usually a browser-cache
// hit rather than a fresh round-trip — except a 504, whose error response the
// failed `<img>` may not have cached, so the probe can re-incur the upstream
// timeout (ProxiedImage holds its loading state until the reason resolves).
const verdicts = new Map<string, ImageFailure>();

/**
 * Re-fetch a failed proxied `src` to learn why it couldn't be displayed. Never
 * rejects: an unreadable result (network error, opaque response) resolves to the
 * generic reason. Only real status reads are cached — a transient failure or an
 * abort is left uncached so a later attempt can re-probe.
 */
export async function probeImageFailure(src: string, signal?: AbortSignal): Promise<ImageFailure> {
    const cached = verdicts.get(src);
    if (cached) return cached;

    try {
        const response = await fetch(src, { signal });
        const failure: ImageFailure = { reason: reasonForStatus(response.status), status: response.status };
        verdicts.set(src, failure);
        return failure;
    } catch {
        return { reason: GENERIC_REASON, status: 0 };
    }
}
