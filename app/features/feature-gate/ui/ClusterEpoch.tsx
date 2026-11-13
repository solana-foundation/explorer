import Link from 'next/link';

import { Cluster, clusterName, clusterSlug } from '@/app/utils/cluster';

/**
 * Link colours shared by the feature-gate pages: the app's link green and its darker hover (styles.css `a` /
 * `a:hover`), as on the address links, so epochs, keys and SIMD links highlight alike.
 */
export const LINK_CLASS_NAME = 'text-dk-primary-dark hover:text-dark-accent-hover';

/** An activation epoch on a cluster, as the feature-gate lists write it: the cluster muted, its epoch a link. */
export function ClusterEpoch({ cluster, epoch }: { cluster: Cluster; epoch: number | bigint }) {
    return (
        <span className="whitespace-nowrap text-outer-space-300">
            {clusterName(cluster)}:{' '}
            <Link href={`/epoch/${epoch}?cluster=${clusterSlug(cluster)}`} className={LINK_CLASS_NAME}>
                {epoch.toString()}
            </Link>
        </span>
    );
}
