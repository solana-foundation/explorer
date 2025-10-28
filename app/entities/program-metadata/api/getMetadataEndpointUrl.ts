import { Cluster, serverClusterUrl } from '../../../utils/cluster';

/**
 * Match cluster to the list of supported ones
 * That is needed to make matching deterministic as "a in Cluster" works differenty with tests and in production due to enum reverse mapping
 * @param cluster
 * @returns
 */
const isClusterSupported = (cluster: Cluster) => {
    return Object.values(Cluster).includes(cluster);
};

/**
 * Return endpoint address for the server if cluster is supported
 *
 * @param cluster
 * @returns
 */
export function getMetadataEndpointUrl(cluster: number): string | undefined {
    if (!isClusterSupported(cluster)) {
        return undefined;
    }

    return serverClusterUrl(cluster, '');
}
