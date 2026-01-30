import '../../styles.css';

import { isReceiptEnabled, RECEIPT_BASE_URL, RECEIPT_OG_IMAGE_VERSION } from '@features/receipt/env';
import { Cluster, CLUSTERS, clusterSlug } from '@utils/cluster';
import { SignatureProps } from '@utils/index';
import { Metadata } from 'next/types';
import React from 'react';

import TransactionDetailsPageClient from './page-client';

type Props = Readonly<{
    params: SignatureProps;
    searchParams: Record<string, string | string[] | undefined>;
}>;

// Custom clusters use user-specific RPCs that the receipt API cannot access
const SHAREABLE_CLUSTERS = CLUSTERS.filter(c => c !== Cluster.Custom);

export async function generateMetadata({ params: { signature }, searchParams }: Props): Promise<Metadata> {
    const isReceiptView = searchParams.view === 'receipt' && isReceiptEnabled;

    if (isReceiptView) {
        const title = `Receipt | ${signature.slice(0, 16)}... | Solana`;
        const description = `Transaction receipt for ${signature} on Solana blockchain`;

        const baseUrl = RECEIPT_BASE_URL;
        const cluster = typeof searchParams.cluster === 'string' ? searchParams.cluster : undefined;
        const clusterEnum = SHAREABLE_CLUSTERS.find(c => clusterSlug(c) === cluster);

        const pageParams = new URLSearchParams();
        pageParams.set('view', 'receipt');
        if (clusterEnum !== undefined) pageParams.set('cluster', clusterSlug(clusterEnum));
        const pageUrl = `${baseUrl}/tx/${signature}?${pageParams}`;

        const ogParams = new URLSearchParams();
        if (RECEIPT_OG_IMAGE_VERSION) ogParams.set('v', RECEIPT_OG_IMAGE_VERSION);
        if (clusterEnum !== undefined && clusterEnum !== Cluster.MainnetBeta) {
            ogParams.set('clusterId', String(clusterEnum));
        }
        const ogQuery = ogParams.toString();
        const ogImageUrl = `${baseUrl}/og/receipt/${signature}${ogQuery ? `?${ogQuery}` : ''}`;
        return {
            description,
            openGraph: {
                description,
                images: [
                    {
                        alt: 'Solana Transaction Receipt',
                        height: 630,
                        url: ogImageUrl,
                        width: 1200,
                    },
                ],
                title,
                type: 'website',
                url: pageUrl,
            },
            title,
            twitter: {
                card: 'summary_large_image',
                description,
                images: [ogImageUrl],
                site: baseUrl,
                title,
            },
        };
    }

    return {
        description: `Details of the Solana transaction with signature ${signature}`,
        title: `Transaction | ${signature} | Solana`,
    };
}

export default function TransactionDetailsPage(props: Props) {
    return <TransactionDetailsPageClient {...props} />;
}
