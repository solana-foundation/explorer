import { parseUrl, SAFE_EXTERNAL_PROTOCOLS } from '@shared/lib/url';

// An RPC endpoint already checked to be an absolute http(s) URL. `parseRpcEndpoint` is the only way to
// build one, so holding an `RpcEndpoint` is proof it parsed: no consumer needs a "not a URL" branch.
//
// The parts are captured up front rather than exposing a `URL`, which is mutable and gets a fresh
// identity per render. This value lives in app-wide React context and consumers memoise on it.
export type RpcEndpoint = Readonly<{
    /** Path, query or fragment present. The consent dialog shows the full URL only when it is. */
    hasPathOrQuery: boolean;
    host: string;
    /** The unit the RPC whitelist matches on. */
    hostname: string;
    /** As given, NOT `URL.href`: compared against saved clusters in localStorage and used as a cache key. */
    href: string;
    /** A link pointing here reaches nothing its sender can read back. */
    isLocal: boolean;
    /** The unit of consent: a rotated key or a new path is the same server. */
    origin: string;
    protocol: string;
}>;

/** The boundary constructor. Everything from a user, a link or storage comes through here. */
export function parseRpcEndpoint(value: string | null | undefined): RpcEndpoint | undefined {
    if (!value) return undefined;
    const url = parseUrl(value);
    // Rejects `javascript:`, `file:`, `ws:`, and a bare `localhost:8899` (protocol `localhost:`, no host).
    if (!url || !SAFE_EXTERNAL_PROTOCOLS.includes(url.protocol)) return undefined;
    return Object.freeze({
        hasPathOrQuery: url.pathname !== '/' || url.search !== '' || url.hash !== '',
        host: url.host,
        hostname: url.hostname,
        href: value,
        isLocal: isLocalHostname(url.hostname),
        origin: url.origin,
        protocol: url.protocol,
    });
}

/**
 * For endpoints written as literals in source. A literal that does not parse is a programming error, so
 * this throws instead of making every caller re-check an `undefined`. Anything from a user or a URL must
 * use `parseRpcEndpoint`.
 */
export function rpcEndpoint(value: string): RpcEndpoint {
    const endpoint = parseRpcEndpoint(value);
    if (!endpoint) throw new Error(`Not an http(s) RPC endpoint: ${value}`);
    return endpoint;
}

/** Shared with `isLocalRpcUrl`, which also sees resolved cluster URLs that never became an `RpcEndpoint`. */
export function isLocalHostname(hostname: string): boolean {
    return hostname === 'localhost' || hostname === '127.0.0.1';
}

export const DEFAULT_CUSTOM_URL = 'http://localhost:8899';

// Parsed once, so the fallback endpoint keeps a stable identity.
export const DEFAULT_RPC_ENDPOINT = rpcEndpoint(DEFAULT_CUSTOM_URL);
