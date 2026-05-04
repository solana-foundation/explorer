import { OwnedTokensCard } from '@components/account/OwnedTokensCard';
import { TokenHistoryCard } from '@components/account/TokenHistoryCard';
import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import { TransactionsProvider } from '@/app/providers/transactions';

type Props = Readonly<{
    params: Promise<{
        address: string;
    }>;
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    const { address } = await props.params;
    return {
        description: `All tokens owned by the address ${address} on Solana`,
        title: `Tokens | ${await getReadableTitleFromAddress(props)} | Solana`,
    };
}

export default async function OwnedTokensPage(props: Props) {
    const { address } = await props.params;

    return (
        <TransactionsProvider>
            <OwnedTokensCard address={address} />
            <TokenHistoryCard address={address} />
        </TransactionsProvider>
    );
}
