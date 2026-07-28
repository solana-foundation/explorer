'use client';

import { Cluster, clusterName, clusterSlug } from '@utils/cluster';
import { useClusterPath } from '@utils/url';

/**
 * "Found on <cluster>" link to the same resource on the cluster where it was located.
 * `pathname` is the resource path on that cluster, e.g. `/tx/<signature>` or `/address/<address>`.
 */
export function AdjacentClusterLink({ foundCluster, pathname }: { foundCluster: Cluster; pathname: string }) {
    const moniker = clusterSlug(foundCluster);
    const foundClusterPath = useClusterPath({
        additionalParams: new URLSearchParams(`cluster=${moniker}`),
        pathname,
    });

    return (
        <a href={foundClusterPath} className="align-middle text-dk-info" style={{ marginRight: '5px' }}>
            Found on {clusterName(foundCluster)}
        </a>
    );
}
