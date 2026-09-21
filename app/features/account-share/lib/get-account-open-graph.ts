import { IMAGE_SIZE } from '@shared/lib/og/image-size';
import { Cluster, clusterSlug, type ServerCluster } from '@utils/cluster';
import { EXPLORER_BASE_URL } from '@utils/env';
import type { Metadata } from 'next/types';

/**
 * Open Graph tags for an account (address) page.
 */
export function getAccountOpenGraph(address: string, cluster?: ServerCluster): Metadata['openGraph'] {
    return {
        images: [{ ...IMAGE_SIZE, alt: 'Solana Account', url: getAccountOgImageUrl(address, cluster) }],
        type: 'website',
        url: getAccountPageUrl(address, cluster),
    };
}

export function getAccountPageUrl(address: string, cluster?: ServerCluster): string {
    return `${EXPLORER_BASE_URL}/address/${address}${clusterQuery(cluster)}`;
}

/** Exported so the address page can aim `twitter.images` at the same URL instead of rebuilding it. */
export function getAccountOgImageUrl(address: string, cluster?: ServerCluster): string {
    return `${EXPLORER_BASE_URL}/og/account/${address}${clusterQuery(cluster)}`;
}

function clusterQuery(cluster: ServerCluster | undefined): string {
    if (cluster === undefined || cluster === Cluster.MainnetBeta) return '';
    return `?cluster=${clusterSlug(cluster)}`;
}
