import { parseUrl } from '@shared/lib/url';

import { Cluster } from './cluster';
import { isLocalHostname } from './rpc-endpoint';

/**
 * Whether `url` points at a local RPC endpoint (localhost / 127.0.0.1). Takes a raw string, because it
 * also sees *resolved* cluster URLs, which never pass through `parseRpcEndpoint`. For a custom endpoint
 * read `RpcEndpoint.isLocal` instead: same answer, no re-parse.
 */
export function isLocalRpcUrl(url: string): boolean {
    const parsed = parseUrl(url);
    return parsed !== undefined && isLocalHostname(parsed.hostname);
}

/** Whether to resolve client-side via direct RPC instead of the server API routes (which only reach known clusters). */
export function shouldUseDirectRpc(cluster: Cluster, url: string): boolean {
    if (cluster === Cluster.Custom) {
        return true;
    }
    // A known cluster can still point at a local validator the server can't reach.
    return isLocalRpcUrl(url);
}
