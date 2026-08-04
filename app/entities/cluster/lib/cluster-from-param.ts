import { Cluster, CLUSTERS, serverClusterUrl } from './cluster';

// Parse a cluster from a numeric query-param string (e.g. "0" → Cluster.MainnetBeta).
// Avoids `n in Cluster` checks, which depend on the enum's reverse mapping and behave
// inconsistently across build targets. The round-trip equality guards against `Number()`
// silently coercing empty / whitespace / leading-zero inputs (e.g. "" → 0).
export function clusterFromParam(value: string): Cluster | undefined {
    const n = Number(value);
    if (!Number.isInteger(n) || String(n) !== value) return undefined;
    return CLUSTERS.find(c => c === n);
}

// Resolve a numeric cluster query-param to its server RPC URL. Returns `undefined` for anything the
// server must not resolve: a malformed param, an unknown cluster, or Custom (whose URL is client-
// supplied). Shared by the `/api/idl-latest` and `/api/security-txt` handlers so both reject the same
// inputs — `clusterFromParam` is stricter than a bare `Number()`, see above.
export function serverClusterUrlFromParam(value: string): string | undefined {
    const cluster = clusterFromParam(value);
    if (cluster === undefined || cluster === Cluster.Custom) return undefined;
    // `|| undefined` keeps the "never an empty string" contract: a `*_RPC_URL` env var set to `""`
    // survives the `??` fallback in `serverClusterUrl`, and callers only check for `undefined`.
    return serverClusterUrl(cluster) || undefined;
}
