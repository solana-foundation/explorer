import { useSetAtom } from 'jotai';

import { clusterModalOpenAtom, useCluster } from '@/app/providers/cluster';
import { Cluster } from '@/app/utils/cluster';

import { BaseClusterSelector } from './BaseClusterSelector';

// FIXME: missing Storybook story — uses useCluster + the cluster modal atom; pure BaseClusterSelector is already covered.
export function ClusterSelector() {
    const { cluster, name } = useCluster();
    const setClusterModalShow = useSetAtom(clusterModalOpenAtom);

    const handleClusterChange = () => {
        setClusterModalShow(true);
    };

    const showMainnetWarning = cluster === Cluster.MainnetBeta;

    return (
        <BaseClusterSelector
            currentCluster={name}
            onClusterChange={handleClusterChange}
            showMainnetWarning={showMainnetWarning}
        />
    );
}
