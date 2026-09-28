import type { StatusCode } from '../errors';

// Upstream statuses that mean the same thing to our caller; anything else is a bad gateway.
export const UPSTREAM_PASSTHROUGH: ReadonlySet<number> = new Set<StatusCode>([
    400, 403, 404, 410, 429, 451, 500, 503, 504,
]);

export function isPassthroughStatus(status: number): status is StatusCode {
    return UPSTREAM_PASSTHROUGH.has(status);
}

export function toProxyStatus(upstream: number): StatusCode {
    return isPassthroughStatus(upstream) ? upstream : 502;
}
