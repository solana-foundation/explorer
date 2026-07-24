import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import SubscriptionsPageClient from './page-client';

type Props = Readonly<{
    params: Promise<{
        address: string;
    }>;
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    const { address } = await props.params;
    return {
        description: `Subscriptions for address ${address} on Solana`,
        title: `Subscriptions | ${await getReadableTitleFromAddress(props)} | Solana`,
    };
}

export default async function SubscriptionsPage(props: Props) {
    const params = await props.params;
    return <SubscriptionsPageClient params={params} />;
}
