import { TransactionHistoryCard } from '@components/account/history/TransactionHistoryCard';
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
    const title = `Transaction History | ${await getReadableTitleFromAddress(props)} | Solana`;
    return {
        description: `History of all transactions involving the address ${address} on Solana`,
        // Feature gate OG images are intentionally shown on the main address page too,
        // so shared links to feature gate addresses always display the rich preview.
        // e.g. /address/5xXZc66h4UdB6Yq7FzdBxBiRAFMMScMLwHxk2QZDaNZL?cluster=testnet
        openGraph: getFeatureGateOpenGraph(address),
        title,
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
