// Configuration for the token-info route. Note: the Next.js route segment config
// (`maxDuration`) stays in route.ts — Next only reads those as literal exports of
// the route module, not via re-export.

import { TOKEN_INFO_REQUEST_LIMIT } from '@entities/token-info/server';

/**
 * Bounds one request, not the holdings list a page may show — the holdings card chunks a longer
 * list by this same value. Callers that send a whole list unchunked are still refused above it.
 */
export const MAX_ADDRESSES = TOKEN_INFO_REQUEST_LIMIT;
