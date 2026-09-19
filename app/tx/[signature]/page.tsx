import '../../styles/styles.css';

import { isReceiptEnabled, RECEIPT_BASE_URL, RECEIPT_OG_IMAGE_VERSION } from '@features/receipt/server';
import { buildCompositeSignature, getClusterParam } from '@features/receipt/server';
import { getTxOgImageUrl, getTxOpenGraph, getTxPageUrl } from '@features/transaction-share/server';
import { IMAGE_SIZE } from '@shared/lib/og/image-size';
import { Cluster, clusterFromSlug, clusterSlug } from '@utils/cluster';
import { SignatureProps } from '@utils/index';
import { Metadata } from 'next/types';
import React from 'react';

import { TransactionDetailsPageClient } from './page-client';

type Props = Readonly<{
    params: Promise<SignatureProps>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export async function generateMetadata(props: Props): Promise<Metadata> {
    const searchParams = await props.searchParams;
    const { signature } = await props.params;

    const clusterParam = getClusterParam(searchParams);
    const cluster = clusterParam === undefined ? undefined : clusterFromSlug(clusterParam);
    // A custom cluster is the visitor's own RPC, which no server route may reach, so no OG route can read it.
    const isCustomCluster = cluster === Cluster.Custom;
    const clusterEnum = cluster === Cluster.Custom ? undefined : cluster;

    const isReceiptView = searchParams.view === 'receipt' && isReceiptEnabled;

    if (isReceiptView) {
        const title = `Receipt | ${signature.slice(0, 16)}... | Solana`;
        const description = `Transaction receipt for ${signature} on Solana blockchain`;

        const baseUrl = RECEIPT_BASE_URL;

        const pageParams = new URLSearchParams();
        pageParams.set('view', 'receipt');
        if (clusterEnum !== undefined) pageParams.set('cluster', clusterSlug(clusterEnum));
        const pageUrl = `${baseUrl}/tx/${signature}?${pageParams}`;

        const compositeSignature = buildCompositeSignature(
            signature,
            RECEIPT_OG_IMAGE_VERSION || undefined,
            clusterEnum,
        );
        const ogImageUrl = isCustomCluster ? undefined : `${baseUrl}/og/receipt/${compositeSignature}`;
        return {
            description,
            openGraph: {
                description,
                ...(ogImageUrl && { images: [{ ...IMAGE_SIZE, alt: 'Solana Transaction Receipt', url: ogImageUrl }] }),
                title,
                type: 'website',
                url: pageUrl,
            },
            title,
            twitter: {
                card: ogImageUrl ? 'summary_large_image' : 'summary',
                description,
                ...(ogImageUrl && { images: [ogImageUrl] }),
                site: baseUrl,
                title,
            },
        };
    }

    const description = `Details of the Solana transaction with signature ${signature}`;
    const title = `Transaction | ${signature.slice(0, 16)}... | Solana`;

    if (isCustomCluster) {
        return {
            description,
            // NOTE: url stays custom-cluster free to avoid exposing it (same as for receipts).
            openGraph: { description, title, type: 'website', url: getTxPageUrl(signature) },
            title,
            twitter: { card: 'summary', description, title },
        };
    }

    return {
        description,
        openGraph: {
            ...getTxOpenGraph(signature, clusterEnum),
            description,
            title,
        },
        title,
        twitter: {
            card: 'summary_large_image',
            description,
            images: [getTxOgImageUrl(signature, clusterEnum)],
            title,
        },
    };
}

export default async function TransactionDetailsPage(props: Props) {
    const params = await props.params;
    return <TransactionDetailsPageClient params={params} />;
}
