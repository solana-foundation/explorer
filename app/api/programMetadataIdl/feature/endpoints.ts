import { serverClusterUrl } from '@/app/utils/cluster';

import { isClusterSupported } from './cluster';

export function getMetadataEndpointUrl(cluster: number): string | undefined {
    if (!isClusterSupported(cluster)) {
        return undefined;
    }
    return serverClusterUrl(cluster, '');
}
