import { EXPLORER_BASE_URL as baseUrl } from '@utils/env';

import { Cluster, clusterSlug } from '../lib/cluster';
import { useCluster } from './use-cluster';

export function buildExplorerLink(cluster: Cluster, customUrl: string | undefined, path: string): string {
    let url: string;
    if (!baseUrl.endsWith('/') && !path.startsWith('/')) {
        url = path === '' ? baseUrl : `${baseUrl}/${path}`;
    } else {
        url = `${baseUrl}${path}`;
    }

    const params = new URLSearchParams();
    switch (cluster) {
        case Cluster.Testnet:
        case Cluster.Devnet:
        case Cluster.Simd296:
            params.append('cluster', clusterSlug(cluster));
            break;
        case Cluster.Custom:
            params.append('cluster', clusterSlug(cluster));
            if (customUrl) params.append('customUrl', customUrl);
            break;
        case Cluster.MainnetBeta:
        default:
            // Mainnet doesn't need cluster parameter
            break;
    }

    const queryString = params.toString();
    if (queryString) {
        if (url.indexOf('?') === -1) {
            return `${url}?${queryString}`;
        }
        // change order for additional params as having ?message at the url and placing it first, breaks input at the Inspector
        const [urlPath, qs] = url.split('?');
        return `${urlPath}?${queryString}&${qs}`;
    }
    return url;
}

export function useExplorerLink(path: string) {
    const { cluster, customUrl } = useCluster();
    return { link: buildExplorerLink(cluster, customUrl, path) };
}
