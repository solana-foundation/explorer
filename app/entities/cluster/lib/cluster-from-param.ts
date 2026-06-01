import { Cluster, CLUSTERS } from '@/app/utils/cluster';

// Parse a cluster from a numeric query-param string (e.g. "0" → Cluster.MainnetBeta).
// Avoids `n in Cluster` checks, which depend on the enum's reverse mapping and behave
// inconsistently across build targets. The round-trip equality guards against `Number()`
// silently coercing empty / whitespace / leading-zero inputs (e.g. "" → 0).
export function clusterFromParam(value: string): Cluster | undefined {
    const n = Number(value);
    if (!Number.isInteger(n) || String(n) !== value) return undefined;
    return CLUSTERS.find(c => c === n);
}
