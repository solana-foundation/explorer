import { Cluster } from './cluster';

/** Whether `url` points at a local RPC endpoint (localhost / 127.0.0.1). */
export function isLocalRpcUrl(url: string): boolean {
    try {
        const { hostname } = new URL(url);
        return hostname === 'localhost' || hostname === '127.0.0.1';
    } catch {
        return false;
    }
}

/** Whether to resolve client-side via direct RPC instead of the server API routes (which only reach known clusters). */
export function shouldUseDirectRpc(cluster: Cluster, url: string): boolean {
    if (cluster === Cluster.Custom) {
        return true;
    }
    // A known cluster can still point at a local validator the server can't reach.
    return isLocalRpcUrl(url);
}
