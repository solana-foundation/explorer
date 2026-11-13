import Link from 'next/link';

import { LINK_CLASS_NAME } from '@/app/shared/ui/link-class-name';
import { Cluster, clusterName, clusterSlug } from '@/app/utils/cluster';

/**
 * An activation epoch on a cluster, as the feature-gate lists write it: the cluster muted, its epoch a link.
 * `Custom` has no enumerable epoch page, and both callers drop it before here, so the prop excludes it.
 */
export function ClusterEpoch({
    cluster,
    epoch,
}: {
    cluster: Exclude<Cluster, Cluster.Custom>;
    epoch: number | bigint;
}) {
    return (
        <span className="whitespace-nowrap text-outer-space-300">
            {clusterName(cluster)}:{' '}
            <Link href={`/epoch/${epoch}?cluster=${clusterSlug(cluster)}`} className={LINK_CLASS_NAME}>
                {epoch.toString()}
            </Link>
        </span>
    );
}
