import { Cluster, clusterFromSlug, DEFAULT_CLUSTER } from './cluster';

export const DEFAULT_CUSTOM_URL = 'http://localhost:8899';

export function parseQuery(searchParams: URLSearchParams | null): Cluster {
    const clusterParam = searchParams?.get('cluster');
    if (clusterParam) {
        return clusterFromSlug(clusterParam) ?? DEFAULT_CLUSTER;
    }
    return DEFAULT_CLUSTER;
}

// Whether to honor a `customUrl` query param: on the Custom cluster (it needs one), when a developer
// opted in via the persisted flag, or when the candidate URL is a trusted host.
export function isCustomUrlAllowed({
    cluster,
    devFlagEnabled,
    candidateUrl,
}: {
    cluster: Cluster;
    devFlagEnabled: boolean;
    candidateUrl: string;
}): boolean {
    return cluster === Cluster.Custom || devFlagEnabled || isWhitelistedRpc(candidateUrl);
}

const WHITELISTED_RPCS = [
    // Used for solana.com live code example
    'engine.mirror.ad',
];

function isWhitelistedRpc(url: string): boolean {
    try {
        return WHITELISTED_RPCS.includes(new URL(url).hostname);
    } catch (_e) {
        return false;
    }
}
