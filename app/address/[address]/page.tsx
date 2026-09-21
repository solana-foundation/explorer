import { getAccountOgImageUrl, getAccountOpenGraph } from '@features/account-share/server';
import { TransactionHistoryCard } from '@features/transaction-history';
import { Cluster, clusterFromSlug } from '@utils/cluster';
import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import { getFeatureGateOpenGraph } from '@/app/features/feature-gate/server';
import { TransactionsProvider } from '@/app/providers/transactions';

type Props = Readonly<{
    params: Promise<{
        address: string;
    }>;
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    const { address } = await props.params;
    const { cluster: clusterParam } = await props.searchParams;
    const title = `Transaction History | ${await getReadableTitleFromAddress(props)} | Solana`;
    const description = `History of all transactions involving the address ${address} on Solana`;

    const featureGateOpenGraph = getFeatureGateOpenGraph(address);
    if (featureGateOpenGraph) {
        return { description, openGraph: featureGateOpenGraph, title };
    }

    const cluster = clusterParam === undefined ? undefined : clusterFromSlug(clusterParam);

    if (cluster === Cluster.Custom) {
        return {
            description,
            openGraph: { description, title, type: 'website' },
            title,
            twitter: { card: 'summary', description, title },
        };
    }

    return {
        description,
        openGraph: { ...getAccountOpenGraph(address, cluster), description, title },
        title,
        twitter: {
            card: 'summary_large_image',
            description,
            images: [getAccountOgImageUrl(address, cluster)],
            title,
        },
    };
}

export default async function TransactionHistoryPage(props: Props) {
    const { address } = await props.params;

    return (
        <TransactionsProvider>
            <TransactionHistoryCard address={address} />
        </TransactionsProvider>
    );
}
