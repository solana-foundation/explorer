import { clusterSelection, getWhitelistedRpcHostnames, parseRpcEndpoint } from '@entities/cluster';
import { Cluster, CLUSTERS, clusterUrl } from '@utils/cluster';

export type EndpointProvenance = 'known' | 'local' | 'unknown';

export function endpointProvenance(url: string | undefined): EndpointProvenance | undefined {
    if (url === undefined) return undefined;
    const endpoint = parseRpcEndpoint(url);
    if (endpoint === undefined) return 'unknown';
    if (endpoint.isLocal) return 'local';
    if (getWhitelistedRpcHostnames().includes(endpoint.hostname)) return 'known';
    const shipsWithIt = CLUSTERS.filter(net => net !== Cluster.Custom).some(
        net => parseRpcEndpoint(clusterUrl(clusterSelection(net)))?.origin === endpoint.origin,
    );
    return shipsWithIt ? 'known' : 'unknown';
}

export function isKnownEndpoint(url: string): boolean {
    return endpointProvenance(url) === 'known';
}
