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

// Why a numeric cluster query-param did not resolve, separated by who has to act: `refused` is the
// caller's input, `unconfigured` is a cluster we own with no endpoint set for it. A route that cannot
// tell them apart either reports abuse or stays silent about its own broken deployment.
export type ServerClusterUrl =
    { kind: 'ok'; cluster: Cluster; url: string } | { kind: 'refused' } | { kind: 'unconfigured'; cluster: Cluster };

// Resolve a numeric cluster query-param to its server RPC URL. Refuses anything the server must not
// resolve: a malformed param, an unknown cluster, or Custom (whose URL is client-supplied). Shared by the
// server route handlers so they all reject the same inputs — `clusterFromParam` is stricter than a bare
// `Number()`, see above.
export function resolveServerClusterUrl(value: string): ServerClusterUrl {
    const cluster = clusterFromParam(value);
    if (cluster === undefined || cluster === Cluster.Custom) return { kind: 'refused' };
    // `|| undefined` keeps the "never an empty string" contract: a `*_RPC_URL` env var set to `""`
    // survives the `??` fallback in `serverClusterUrl`.
    const url = serverClusterUrl(cluster) || undefined;
    return url === undefined ? { cluster, kind: 'unconfigured' } : { cluster, kind: 'ok', url };
}

export function serverClusterUrlFromParam(value: string): string | undefined {
    const resolved = resolveServerClusterUrl(value);
    return resolved.kind === 'ok' ? resolved.url : undefined;
}
