// Configuration for the token-info route. Note: the Next.js route segment config
// (`maxDuration`) stays in route.ts — Next only reads those as literal exports of
// the route module, not via re-export.

/** How long a resolved token list stays fresh in the Next data cache. */
export const CACHE_MAX_AGE = 3600; // 1 hour

/**
 * Caps how many distinct mints one request may resolve. `TokensProvider` sends
 * up to 101 token accounts, so this leaves headroom without letting a caller
 * fan out an unbounded number of RPC lookups.
 */
export const MAX_ADDRESSES = 128;
