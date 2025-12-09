import { useCluster, useClusterModal } from '@/app/providers/cluster';
import { Cluster } from '@/app/utils/cluster';

import { BaseClusterSelector } from './BaseClusterSelector';

export function ClusterSelector() {
    const { cluster, name } = useCluster();
    const [, setClusterModalShow] = useClusterModal();

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
