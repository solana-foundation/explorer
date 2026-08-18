'use client';

import { Cluster, clusterSlug, DEFAULT_CLUSTER } from '@utils/cluster';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

// Omitting `customUrl` keeps whatever endpoint the query string already carries; an empty string clears
// it, matching how the reader treats the param (see `useClusterUrl`).
export type ClusterSelection = { cluster: Cluster; customUrl?: string };

// Every switcher control navigates in place, so each href is the live query string with only the cluster
// keys changed: unrelated params (a tab, a sort) belong to the page underneath and must survive a switch.
//
// Not `useBuildClusterPath` (`entities/cluster/model/use-cluster-path.ts`), which carries an existing
// selection onto a new path. This one authors the selection.
export function useClusterHref() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    return useCallback(
        ({ cluster, customUrl }: ClusterSelection) => {
            const params = new URLSearchParams(searchParams?.toString());

            // The default cluster is expressed by the absence of the param.
            if (cluster === DEFAULT_CLUSTER) params.delete('cluster');
            else params.set('cluster', clusterSlug(cluster));

            if (customUrl === '') params.delete('customUrl');
            else if (customUrl !== undefined) params.set('customUrl', customUrl);

            const query = params.toString();
            return `${pathname}${query ? `?${query}` : ''}`;
        },
        [pathname, searchParams],
    );
}
