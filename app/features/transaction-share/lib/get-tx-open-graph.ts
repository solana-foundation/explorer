import { IMAGE_SIZE } from '@shared/lib/og/image-size';
import { Cluster, clusterSlug, type ServerCluster } from '@utils/cluster';
import type { Metadata } from 'next/types';

import { TX_OG_BASE_URL } from '../env';

/**
 * Open Graph tags for a transaction page.
 */
export function getTxOpenGraph(signature: string, cluster?: ServerCluster): Metadata['openGraph'] {
    return {
        images: [{ ...IMAGE_SIZE, alt: 'Solana Transaction', url: getTxOgImageUrl(signature, cluster) }],
        type: 'website',
        url: `${TX_OG_BASE_URL}/tx/${signature}${clusterQuery(cluster)}`,
    };
}

/** Exported so `page.tsx` can aim `twitter.images` at the same URL instead of rebuilding it. */
export function getTxOgImageUrl(signature: string, cluster?: ServerCluster): string {
    return `${TX_OG_BASE_URL}/og/tx/${signature}${clusterQuery(cluster)}`;
}

function clusterQuery(cluster: ServerCluster | undefined): string {
    if (cluster === undefined || cluster === Cluster.MainnetBeta) return '';
    return `?cluster=${clusterSlug(cluster)}`;
}
