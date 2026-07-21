import type { SupportedCluster } from '../config.js';

// The config map is always fully populated (app-side defaults) — this is the typed seam the RPC layer reads through.
export function resolveRpcEndpoint(cluster: SupportedCluster, rpcEndpoints: Record<SupportedCluster, string>): string {
    return rpcEndpoints[cluster];
}
