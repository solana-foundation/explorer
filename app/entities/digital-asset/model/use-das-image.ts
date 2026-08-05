import useSWR from 'swr';

import { useCluster } from '@/app/providers/cluster';
import { Cluster, clusterSlug } from '@/app/utils/cluster';

type DasImageKey = ['das-image', string, string];

// The cluster slug alone identifies the endpoint: the route rejects the Custom cluster, so a Custom
// entry never holds a per-endpoint image and needs no `customUrl` in its key.
function getDasImageKey(cluster: Cluster, mintAddress: string): DasImageKey {
    return ['das-image', mintAddress, clusterSlug(cluster)];
}

// Sends no `customUrl`. The route rejects the Custom cluster, so custom-cluster images do not render
// either way — forwarding the user's endpoint would leak it to our server for nothing.
async function fetchDasImage([, mintAddress, cluster]: DasImageKey): Promise<string | undefined> {
    try {
        const params = new URLSearchParams({ cluster });
        const response = await fetch(`/api/token-image/${mintAddress}?${params}`);
        if (!response.ok) return undefined;
        const data = await response.json();
        return typeof data.image === 'string' ? data.image : undefined;
    } catch {
        return undefined;
    }
}

const DAS_IMAGE_SWR_CONFIG = {
    dedupingInterval: 5 * 60 * 1000,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
};

export function useDasImage(mintAddress?: string): string | undefined {
    const { cluster } = useCluster();
    const swrKey = mintAddress ? getDasImageKey(cluster, mintAddress) : undefined;
    const { data } = useSWR(swrKey, fetchDasImage, DAS_IMAGE_SWR_CONFIG);
    return data;
}
