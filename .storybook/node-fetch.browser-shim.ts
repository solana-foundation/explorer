// Browser shim for node-fetch. Legacy @solana/web3.js 1.x imports node-fetch at module top-level
// (where it reads http.STATUS_CODES); in the browser it always uses globalThis.fetch, so this only
// needs to satisfy the import without dragging in Node's externalized `http`.
const fetchFn = globalThis.fetch.bind(globalThis);

export default fetchFn;
export const fetch = fetchFn;
export const Headers = globalThis.Headers;
export const Request = globalThis.Request;
export const Response = globalThis.Response;
