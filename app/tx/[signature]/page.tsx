import '../../styles.css';

import { isReceiptEnabled } from '@features/receipt';
import { Cluster, clusterSlug } from '@utils/cluster';
import { SignatureProps } from '@utils/index';
import { Metadata } from 'next/types';
import React from 'react';

import TransactionDetailsPageClient from './page-client';

type Props = Readonly<{
    params: SignatureProps;
    searchParams: Record<string, string | string[] | undefined>;
}>;

/// Receipt feature require BASE_URL to be set
const RECEIPT_BASE_URL = process.env.RECEIPT_BASE_URL ?? '';
const SHAREABLE_CLUSTERS = [Cluster.MainnetBeta, Cluster.Testnet, Cluster.Devnet, Cluster.Simd296] as const;
const SHAREABLE_CLUSTER_SLUGS = SHAREABLE_CLUSTERS.map(clusterSlug);

export async function generateMetadata({ params: { signature }, searchParams }: Props): Promise<Metadata> {
    const isReceiptView = searchParams.view === 'receipt' && isReceiptEnabled;

    if (isReceiptView) {
        const title = `Receipt | ${signature.slice(0, 16)}... | Solana`;
        const description = `Transaction receipt for ${signature} on Solana blockchain`;

        const baseUrl = RECEIPT_BASE_URL.trim();
        const cluster = typeof searchParams.cluster === 'string' ? searchParams.cluster : undefined;
        const isShareableCluster = cluster && SHAREABLE_CLUSTER_SLUGS.includes(cluster);
        const clusterParam = isShareableCluster ? `&cluster=${cluster}` : '';

        const pageUrl = `${baseUrl}/tx/${signature}?view=receipt${clusterParam}`;
        const ogImageUrl = `${baseUrl}/og/receipt/${signature}`;
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
