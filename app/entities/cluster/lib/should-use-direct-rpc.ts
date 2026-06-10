import { Cluster } from '@/app/utils/cluster';

/**
 * Check if the URL is a local RPC endpoint (localhost or 127.0.0.1)
 */
export function isLocalRpcUrl(url: string): boolean {
    try {
        const { hostname } = new URL(url);
        return hostname === 'localhost' || hostname === '127.0.0.1';
    } catch {
        return false;
    }
}

/**
 * Check if the cluster should use direct client-side RPC fetching
 * instead of the API routes (which only support known public clusters)
 */
export function shouldUseDirectRpc(cluster: Cluster, url: string): boolean {
    // Custom cluster always uses direct RPC
    if (cluster === Cluster.Custom) {
        return true;
    }
    // Also check if URL is localhost even for other clusters
    return isLocalRpcUrl(url);
}
