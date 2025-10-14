import { Cluster, serverClusterUrl } from '../../../utils/cluster';
import { IDL_SEED } from './getProgramCanonicalMetadata';

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
export function getMetadataEndpointUrl(cluster: number, seed: string | null): string | undefined {
    if (!isClusterSupported(cluster)) {
        return undefined;
    }

    // NOTE: originally we did not allow to load idls for all the clusters except the mainnet
    // At the moment we allow to load not only the idl but security.txt as well
    // Preserve orignal logic to prevent loading idls for clusters except mainnet (custom also as it might direct the mainnet)
    if (seed === IDL_SEED && !(Cluster.MainnetBeta === cluster || Cluster.Custom === cluster)) {
        return undefined;
    }

    return serverClusterUrl(cluster, '');
}
