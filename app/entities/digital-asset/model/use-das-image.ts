import useSWR from 'swr';

import { useCluster } from '@/app/providers/cluster';
import { Cluster, clusterSlug } from '@/app/utils/cluster';

type DasImageKey = ['das-image', string, string, string];

function getDasImageKey(cluster: Cluster, mintAddress: string, customUrl: string): DasImageKey {
    return ['das-image', mintAddress, clusterSlug(cluster), customUrl];
}

async function fetchDasImage([, mintAddress, cluster, customUrl]: DasImageKey): Promise<string | undefined> {
    try {
        const params = new URLSearchParams({ cluster });
        if (customUrl) params.set('customUrl', customUrl);
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
    const { cluster, customUrl } = useCluster();
    const swrKey = mintAddress ? getDasImageKey(cluster, mintAddress, customUrl) : undefined;
    const { data } = useSWR(swrKey, fetchDasImage, DAS_IMAGE_SWR_CONFIG);
    return data;
}
