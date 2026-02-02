import { TransactionHistoryCard } from '@components/account/history/TransactionHistoryCard';
import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import { TransactionsProvider } from '@/app/providers/transactions';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    return {
        description: `History of all transactions involving the address ${props.params.address} on Solana`,
        title: `Transaction History | ${await getReadableTitleFromAddress(props)} | Solana`,
    };
}

export default function TransactionHistoryPage({ params: { address } }: Props) {
    return (
        <TransactionsProvider>
            <TransactionHistoryCard address={address} />
        </TransactionsProvider>
    );
}
