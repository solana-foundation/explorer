import { Cluster, CLUSTERS, serverClusterUrl } from '@/app/utils/cluster';

// Parse a cluster from a numeric query-param string (e.g. "0" → Cluster.MainnetBeta).
// Avoids `n in Cluster` checks, which depend on the enum's reverse mapping and behave
// inconsistently across build targets. The round-trip equality guards against `Number()`
// silently coercing empty / whitespace / leading-zero inputs (e.g. "" → 0).
export function clusterFromParam(value: string): Cluster | undefined {
    const n = Number(value);
    if (!Number.isInteger(n) || String(n) !== value) return undefined;
    return CLUSTERS.find(c => c === n);
}

// Resolve a numeric cluster query-param to its server RPC URL, or `undefined` when the param isn't a
// known cluster. Shared by the `/api/idl-latest` and `/api/security-txt` route handlers so both reject
// the same malformed inputs (`clusterFromParam` is stricter than a bare `Number()` — see above). A
// custom cluster resolves to an empty URL (no server endpoint), which the routes treat as invalid.
export function serverClusterUrlFromParam(value: string): string | undefined {
    const cluster = clusterFromParam(value);
    if (cluster === undefined) return undefined;
    return serverClusterUrl(cluster, '') || undefined;
}
