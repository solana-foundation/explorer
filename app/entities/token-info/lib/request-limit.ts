/**
 * How many distinct mints one `/api/token-info` request may carry. The route rejects a
 * larger body and the browser chunks by it, so both must read this one value — keep this
 * module import-free so either side can. Jupiter answers 200 and omits every mint after the
 * hundredth, so one route request maps to one Jupiter request, and one failed Jupiter request
 * cannot drop the mints of another.
 */
export const TOKEN_INFO_REQUEST_LIMIT = 100;
