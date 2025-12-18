import { EXPLORER_BASE_URL as baseUrl } from '@utils/env';

import { useCluster } from '@/app/providers/cluster';
import { Cluster, clusterSlug } from '@/app/utils/cluster';

export function useExplorerLink(path: string) {
    const { cluster, customUrl } = useCluster();

    // Build the full URL with path
    let url: string;
    if (!baseUrl.endsWith('/') && !path.startsWith('/')) {
        if (path === '') {
            url = baseUrl;
        } else {
            url = `${baseUrl}/${path}`;
        }
    } else {
        url = `${baseUrl}${path}`;
    }

    // Add cluster query parameter for non-mainnet clusters
    const params = new URLSearchParams();

    switch (cluster) {
        case Cluster.Testnet:
            params.append('cluster', clusterSlug(cluster));
            break;
        case Cluster.Devnet:
            params.append('cluster', clusterSlug(cluster));
            break;
        case Cluster.Simd296:
            params.append('cluster', clusterSlug(cluster));
            break;
        case Cluster.Custom:
            params.append('cluster', clusterSlug(cluster));
            if (customUrl) {
                params.append('customUrl', customUrl);
            }
            break;
        case Cluster.MainnetBeta:
        default:
            // Mainnet doesn't need cluster parameter
            break;
    }

    // Add query parameters if any
    const queryString = params.toString();
    if (queryString) {
        url += `?${queryString}`;
    }

    return { link: url };
}
