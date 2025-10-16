import { Cluster } from '@/app/utils/cluster';

/**
 * Match cluster to the list of supported ones
 * That is needed to make matching deterministic as "a in Cluster" works differenty with tests and in production due to enum reverse mapping
 * @param cluster
 * @returns
 */
export const isClusterSupported = (cluster: Cluster) => {
    const isSupported = Object.values(Cluster).includes(cluster);

    return isSupported;
};
