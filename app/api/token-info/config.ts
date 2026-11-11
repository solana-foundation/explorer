// Configuration for the token-info routes. Each route file declares its own `maxDuration`,
// because Next reads route segment config only as a literal route export.

import { TOKEN_INFO_REQUEST_LIMIT } from '@entities/token-info/server';

/**
 * Bounds one request, not the holdings list a page may show — the holdings card chunks a longer
 * list by this same value. Callers that send a whole list unchunked are still refused above it.
 */
export const MAX_ADDRESSES = TOKEN_INFO_REQUEST_LIMIT;
