// Kept apart from the response helpers beside them, which pull in `next/server`: these are the numbers
// the browser needs too, and a client bundle should not carry a server runtime to read one.

/** How long any one caller waits on an RPC node before giving up. */
export const UPSTREAM_TIMEOUT_MS = 30_000;

/**
 * Above the function duration declared by the route this bounds — not merely above its RPC bound, since a
 * cold start and the hop through the CDN sit between the two. A browser that gives up first turns a
 * classified answer into an unclassified abort, which reads as retryable and is recorded nowhere.
 */
export const ROUTE_TIMEOUT_MS = 40_000;
