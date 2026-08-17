'use client';

import { Cluster, clusterName, clusterSlug } from '../lib/cluster';
import { useClusterPath } from '../model/use-cluster-path';

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
        // `hover:text-dk-info` pins the hover color: styles.css `a:hover` (0,1,1) outranks a bare
        // `text-dk-info` (0,1,0), so without it the link turns dashkit green under the cursor.
        <a
            href={foundClusterPath}
            className="align-middle text-dk-info hover:text-dk-info"
            style={{ marginRight: '5px' }}
        >
            Found on {clusterName(foundCluster)}
        </a>
    );
}
