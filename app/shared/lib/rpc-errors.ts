// JSON-RPC's dedicated "method not found" code.
const METHOD_NOT_FOUND = -32601;
// JSON-RPC's generic "Internal error". Some endpoints (Helius, for one) report an unknown
// method with this instead of -32601 and put the real reason in the message, so it is the
// one structured code whose message we still have to read.
const INTERNAL_ERROR = -32603;

/**
 * Whether an RPC error means the endpoint does not implement the method that was called.
 * Callers use it to tell "this node is too old for the call" from "this call failed" —
 * one is answered by falling back or staying quiet, the other by trying again.
 *
 * A false positive costs whatever the fallback gives up; a false negative presents a node's
 * age as a failure, so an ambiguous code is resolved by reading the message.
 */
export function isMethodNotFound(error: unknown): boolean {
    const { code, message } = (error ?? {}) as { code?: number; message?: string };
    if (code === METHOD_NOT_FOUND) return true;
    // Any other structured code is authoritative: don't let a coincidental message substring
    // (e.g. a proxy error page) downgrade the endpoint on a failure that has nothing to do
    // with the method being missing.
    if (typeof code === 'number' && code !== INTERNAL_ERROR) return false;
    const text = typeof message === 'string' ? message.toLowerCase() : '';
    return text.includes('method not found') || text.includes('unsupported method');
}
